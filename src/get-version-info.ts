import { httpGet, streamToObject, withCache } from './utils'
import { pipeline } from 'node:stream/promises'
import zlib from 'node:zlib'
import tarStream from 'tar-stream'

type Packument = { versions: Record<string, { dist: { tarball: string } }> }
type DownloadStats = { downloads: Record<string, number> }
type PackageFile = { type: string }

/**
 * The total download counts for each version of a package, along with whether each version is ESM or not.
 */
export type VersionInfo = {
  packageName: string
  versions: {
    [version: string]: {
      downloads: number
      isEsm: boolean
    }
  }
}

export const getVersionInfo = async (packageName: string): Promise<VersionInfo> => {
  const result: VersionInfo = {
    packageName,
    versions: {},
  }
  // gets the extended metadata about a package, including the tarball URL for each version
  const packument = await withCache(`packuments/${packageName}.json`, async () => {
    return httpGet<Packument>(`https://registry.npmjs.org/${packageName}`)
  })

  // gets the download counts for each version over the last week, similar to the 'versions' tab on npmjs.com
  const { downloads } = await withCache(`download-stats/${packageName}.json`, async () => {
    return httpGet<DownloadStats>(`https://api.npmjs.org/versions/${encodeURIComponent(packageName)}/last-week`)
  })

  // for each version, download the tarball, extract the `package.json` file, and check if `type === 'module'`
  for (const version of Object.keys(downloads).sort()) {
    const tarballUrl = packument.versions[version].dist.tarball
    const packageFile = await withCache(`package-files/${packageName}/${version}/package.json`, async () => {
      const artifactStream = await httpGet(tarballUrl, { rawStream: true })

      const extract = tarStream.extract()
      const done = pipeline(artifactStream, zlib.createGunzip(), extract)

      let packageFile: PackageFile | undefined

      for await (const entry of extract) {
        if (entry.header.name === 'package/package.json') {
          packageFile = await streamToObject(entry)
        }
        entry.resume()
      }

      await done
      if (!packageFile) {
        throw new Error(`Could not find package.json in ${tarballUrl}`)
      }
      return packageFile
    })
    result.versions[version] = {
      downloads: downloads[version],
      isEsm: packageFile.type === 'module',
    }
  }
  return result
}
