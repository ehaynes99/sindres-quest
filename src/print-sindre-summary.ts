import { summarize } from './summarize'

const formatNumber = (n: number): string => n.toLocaleString('en-US')

export const run = async (): Promise<void> => {
  const summary = await summarize('sindresorhus')

  const lines = [
    `* number of packages: ${formatNumber(summary.totalPackages)}`,
    `* total number of versions: ${formatNumber(summary.totalVersions)}`,
    `* total downloads: ${formatNumber(summary.totalDownloads)}`,
    `* total downloads of ESM versions: ${formatNumber(summary.totalEsm)}`,
    `* total downloads of CJS versions: ${formatNumber(summary.totalCjs)}`,
    `* percentage of downloads that are ESM versions: ${summary.percentEsm.toFixed(2)}%`,
  ]
  console.log(lines.join('\n'))
}

void run().catch((error: unknown) => console.error(error))
