import { httpGet, withCache } from './utils'

/**
 * Get all package names published by a given author.
 */
export const getPackages = async (author: string): Promise<string[]> => {
  type RegistrySearchResult = { objects: { package: { name: string } }[] }

  const result: string[] = []

  return withCache(`packages-by-author/${author}.json`, async () => {
    const url = new URL('https://registry.npmjs.org/-/v1/search?size=250')
    url.searchParams.set('text', `author:${author}`)
    let from = 0

    while (true) {
      url.searchParams.set('from', from.toString())
      const { objects } = await httpGet<RegistrySearchResult>(url.toString())
      if (objects.length === 0) {
        break
      }
      result.push(...objects.map((obj) => obj.package.name))
      from += objects.length
    }

    return result
  })
}
