import { summarize } from './summarize'

export const run = async (): Promise<void> => {
  const summary = await summarize('sindresorhus')

  const { authorName, packages, topEsm, topCjs, percentEsm, ...rest } = summary
  console.log({
    authorName,
    ...rest,
    percentEsm: percentEsm.toFixed(2),
  })
}

void run().catch((error: unknown) => console.error(error))
