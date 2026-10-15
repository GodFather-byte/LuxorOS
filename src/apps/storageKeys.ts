import type { AppId } from '../kernel/types'

/** localStorage key of each micro-app's document. Renaming one orphans data users already saved. */
export const STORAGE_KEYS = {
  notes: 'luxoros:notes',
  sheets: 'luxoros:sheets:v1',
  writer: 'luxoros:writer:v1',
  browser: 'luxoros:portal:v1',
} as const satisfies Record<AppId, string>
