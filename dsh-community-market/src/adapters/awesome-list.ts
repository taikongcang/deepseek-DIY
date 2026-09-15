import type { CatalogQuery } from '../contracts/generated/catalog-query.js'
import type { CatalogSnapshot } from '../contracts/generated/catalog-snapshot.js'
import type { CatalogAdapter, CatalogFetchContext } from '../contracts/types.js'
import { parseCatalogSnapshot } from '../contracts/validate.js'
import {
  AWESOME_CATALOG_CATEGORIES,
  AWESOME_CATALOG_ENTRIES,
  AWESOME_CATALOG_GENERATED_AT,
  type AwesomeCatalogEntry,
} from '../data/awesome-catalog.js'

// 沿用旧版「② DSH Marketplace」的内置源 key 字面值。新版社区版已把该源整个删除，
// 但"升级安装到同一目录"时旧记录仍留在 userData 的 sources 里：同一个 key 让那条
// 记录直接显示为 Awesome DSH Plugins，用户不需要重新添加。
export const AWESOME_LIST_KEY = 'dsh-marketplace-qilewl'
/** 旧版「DSH Marketplace」的适配器 id，仅用于让升级安装里的旧记录继续解析到本适配器。 */
export const AWESOME_LIST_LEGACY_ADAPTER_ID = 'market.dsh-marketplace-qilewl-v1'
export const AWESOME_LIST_PROVIDER_ID = 'awesome-dsh-plugins.community'
export const AWESOME_LIST_ADAPTER_ID = 'market.awesome-list-v1'
export const AWESOME_LIST_PUBLIC_ENDPOINT = 'https://awesome-dsh-plugin.com/'
export const AWESOME_LIST_DATA_URL = 'https://github.com/awesome-dsh-plugin/awesome-dsh-plugin'

const PAGE_SIZE = 100
const MAX_LIMIT = 100

type CatalogItem = CatalogSnapshot['items'][number]

function isZhLocale(locale: string | undefined): boolean {
  return locale?.toLowerCase().startsWith('zh') ?? false
}

function entryText(entry: AwesomeCatalogEntry, zh: boolean): string {
  const text = (zh ? entry.descZh ?? entry.descEn : entry.descEn ?? entry.descZh) ?? ''
  return text.length > 0 ? text : entry.name
}

function entryHaystack(entry: AwesomeCatalogEntry, zh: boolean): string {
  return [
    entry.id,
    entry.name,
    entryText(entry, zh),
    entry.owner,
    entry.category,
  ].join('\n').toLocaleLowerCase('en-US')
}

function toItem(entry: AwesomeCatalogEntry, context: CatalogFetchContext, zh: boolean): CatalogItem {
  const repositoryUrl = `https://github.com/${entry.owner}/${entry.repo}`
  const item: CatalogItem = {
    id: entry.id,
    name: entry.name,
    displayName: entry.name,
    summary: entryText(entry, zh),
    homepage: repositoryUrl,
    categories: [entry.category],
    keywords: [entry.category, entry.owner],
    repository: entry.subdirectory === null
      ? { url: repositoryUrl }
      : { url: repositoryUrl, subdirectory: entry.subdirectory },
    publisher: { name: entry.owner, url: `https://github.com/${entry.owner}` },
    provenance: {
      sourceRecordId: context.source.sourceRecordId,
      providerId: context.source.providerId,
      itemId: entry.id,
    },
  }
  if (entry.version !== null) item.latestVersion = entry.version
  if (entry.commit !== null) item.installSource = { kind: 'github', commit: entry.commit }
  if (entry.updatedAt !== null) item.updatedAt = entry.updatedAt
  return item
}

function snapshot(
  items: readonly CatalogItem[],
  page: { readonly total: number; readonly nextCursor?: string },
  context: CatalogFetchContext,
): CatalogSnapshot {
  return parseCatalogSnapshot({
    schemaVersion: '1.0.0',
    source: {
      sourceRecordId: context.source.sourceRecordId,
      providerId: context.source.providerId,
      adapterId: context.source.adapterId,
      registrationKind: context.source.registrationKind,
      fetchedAt: new Date().toISOString(),
      finalUrl: AWESOME_LIST_DATA_URL,
      providerGeneratedAt: AWESOME_CATALOG_GENERATED_AT,
      providerRevision: AWESOME_CATALOG_GENERATED_AT,
    },
    items,
    page,
  })
}

function filterEntries(query: CatalogQuery, zh: boolean): readonly AwesomeCatalogEntry[] {
  let result: readonly AwesomeCatalogEntry[] = AWESOME_CATALOG_ENTRIES
  const categories = query.category ?? []
  if (categories.length > 0) {
    result = result.filter(entry => categories.includes(entry.category))
  }
  const search = query.q?.toLocaleLowerCase('en-US')
  if (search !== undefined) {
    result = result.filter(entry => entryHaystack(entry, zh).includes(search))
  }
  if (query.sort === 'name') {
    result = [...result].sort((left, right) => left.name.localeCompare(right.name, query.locale ?? 'en', { sensitivity: 'base' }))
  } else if (query.sort === 'updated') {
    result = [...result].sort((left, right) => (Date.parse(right.updatedAt ?? '') || 0) - (Date.parse(left.updatedAt ?? '') || 0))
  }
  return result
}

function requestedOffset(query: CatalogQuery): number {
  const raw = query.cursor ?? '0'
  if (!/^\d+$/u.test(raw)) throw new Error('awesome-list cursor is invalid')
  const offset = Number(raw)
  if (!Number.isSafeInteger(offset) || offset < 0) throw new Error('awesome-list cursor is invalid')
  return offset
}

export const awesomeListAdapter: CatalogAdapter = {
  adapterId: AWESOME_LIST_ADAPTER_ID,
  async fetch(query, context) {
    context.signal.throwIfAborted()
    const zh = isZhLocale(query.locale)
    // 数据内置在包里，无 capability 元数据；按能力过滤只能返回空结果
    const filtered = (query.capability?.length ?? 0) > 0 ? [] : filterEntries(query, zh)
    const offset = requestedOffset(query)
    const limit = Math.min(query.limit ?? 50, MAX_LIMIT)
    const end = Math.min(offset + limit, filtered.length)
    const items = filtered.slice(offset, end).map(entry => toItem(entry, context, zh))
    return snapshot(items, {
      total: filtered.length,
      ...(end < filtered.length ? { nextCursor: String(end) } : {}),
    }, context)
  },
  async fetchCategories() {
    return AWESOME_CATALOG_CATEGORIES
  },
  async scanCatalog(query, context) {
    context.signal.throwIfAborted()
    const zh = isZhLocale(query.locale)
    const items = AWESOME_CATALOG_ENTRIES.map(entry => toItem(entry, context, zh))
    if (items.length === 0) return [snapshot([], { total: 0 }, context)]
    const result: CatalogSnapshot[] = []
    for (let offset = 0; offset < items.length; offset += PAGE_SIZE) {
      result.push(snapshot(items.slice(offset, offset + PAGE_SIZE), { total: items.length }, context))
    }
    return result
  },
}
