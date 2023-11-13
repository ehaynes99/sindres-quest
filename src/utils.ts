import fs from 'fs-extra'
import http from 'node:https'
import path from 'node:path'
import { Readable } from 'node:stream'

export const CACHE_DIR = `${__dirname}/../cache`

export const cacheFilePath = (file: string): string => {
  return `${CACHE_DIR}/${file}`
}

/**
 * Simple disk cache for JSON data. If the cache file exists, return its contents. Otherwise,
 * call the `load` function, write the result to the cache file, and return the result.
 */
export const withCache = async <T>(file: string, load: () => Promise<T>): Promise<T> => {
  const fullPath = `${CACHE_DIR}/${file}`
  if (fs.existsSync(fullPath)) {
    return fs.readJson(fullPath)
  }

  await fs.ensureDir(path.dirname(fullPath))
  const data = await load()
  await fs.writeJson(fullPath, data, { spaces: 2 })
  return data
}

export type HttpGet = {
  <T>(url: string): Promise<T>
  (url: string, opts: { rawStream: true }): Promise<Readable>
}

export const httpGet: HttpGet = async (url: string, opts?: { rawStream: true }) => {
  const res = await new Promise<Readable>((resolve, reject) => {
    http.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Request failed with status code ${res.statusCode}. URL: ${url}`))
      }
      resolve(res)
    })
  })

  if (opts?.rawStream) {
    return res
  }
  return streamToObject(res) as any
}

export const streamToObject = <T>(stream: Readable): Promise<T> => {
  const chunks: Buffer[] = []
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(chunk))
    stream.on('error', (err) => reject(err))
    stream.on('end', () => resolve(JSON.parse(Buffer.concat(chunks).toString())))
  })
}

export const concurrent = async (count: number, fn: () => Promise<void>) => {
  await Promise.all(Array.from({ length: count }, () => null).map(fn))
}
