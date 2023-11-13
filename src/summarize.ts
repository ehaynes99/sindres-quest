import { getPackages } from './get-packages'
import { getVersionInfo } from './get-version-info'
import { concurrent } from './utils'

export type PackageSummary = {
  packageName: string
  numVersions: number
  downloads: number
  esm: number
  cjs: number
}

export type Summary = {
  authorName: string
  packages: PackageSummary[]
  totalPackages: number
  totalVersions: number
  totalDownloads: number
  totalEsm: number
  totalCjs: number
  percentEsm: number
  topEsm: PackageSummary[]
  topCjs: PackageSummary[]
}

export const summarize = async (authorName: string): Promise<Summary> => {
  const packages = await getPackages(authorName)

  const packageSummaries: PackageSummary[] = []
  let totalDownloads = 0
  let totalVersions = 0
  let totalEsm = 0
  let totalCjs = 0

  let count = 0
  const remaining = [...packages]
  await concurrent(10, async () => {
    while (remaining.length) {
      const packageName = remaining.pop()!
      const packageSummary = await createSummary(packageName)
      if (packageSummary.downloads > 0) {
        totalDownloads += packageSummary.downloads
        totalVersions += packageSummary.numVersions
        totalEsm += packageSummary.esm
        totalCjs += packageSummary.cjs

        packageSummaries.push(packageSummary)
      }
      console.log(`${packageName} (${++count}/${packages.length})`)
    }
  })

  return {
    authorName,
    packages: packageSummaries,
    totalPackages: packageSummaries.length,
    totalVersions,
    totalDownloads,
    totalEsm,
    totalCjs,
    percentEsm: (totalEsm / totalDownloads) * 100,
    topEsm: topBy(packageSummaries, 'esm', 10),
    topCjs: topBy(packageSummaries, 'cjs', 10),
  }
}

const createSummary = async (packageName: string): Promise<PackageSummary> => {
  const versionInfo = await getVersionInfo(packageName)
  let esm = 0
  let cjs = 0

  for (const version in versionInfo.versions) {
    const { downloads, isEsm } = versionInfo.versions[version]
    if (isEsm) {
      esm += downloads
    } else {
      cjs += downloads
    }
  }

  const total = esm + cjs

  return {
    packageName,
    numVersions: Object.keys(versionInfo.versions).length,
    downloads: total,
    esm,
    cjs,
  }
}

type NumberKey = 'downloads' | 'esm' | 'cjs'

const topBy = (values: PackageSummary[], field: NumberKey, count: number) => {
  const sorted = values.sort((a, b) => b[field] - a[field])
  if (count < 0) {
    return sorted.reverse().slice(0, -count)
  }
  return sorted.slice(0, count)
}
