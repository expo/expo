import type { LoadedRoute } from './Route';

/**
 * The subset of a layout's `unstable_settings` that the router needs before the layout module
 * has loaded: the anchor, and the anchor of each group the layout belongs to.
 */
export type StaticLayoutSettings = Record<string, unknown>;

const ANCHOR_KEYS = ['anchor', 'initialRouteName'] as const;

function pickAnchorSettings(value: unknown): Record<string, string> | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const picked: Record<string, string> = {};
  for (const key of ANCHOR_KEYS) {
    const anchor = (value as Record<string, unknown>)[key];
    if (typeof anchor === 'string') {
      picked[key] = anchor;
    }
  }
  return Object.keys(picked).length ? picked : null;
}

/**
 * Returns the JSON-serializable part of `unstable_settings` that seeds navigation state, or
 * `null` when the layout has no anchor settings.
 */
export function serializeLayoutSettings(
  settings: LoadedRoute['unstable_settings']
): StaticLayoutSettings | null {
  if (!settings || typeof settings !== 'object') {
    return null;
  }

  const serialized: StaticLayoutSettings = { ...pickAnchorSettings(settings) };
  for (const [key, value] of Object.entries(settings)) {
    if ((ANCHOR_KEYS as readonly string[]).includes(key)) {
      continue;
    }
    // Group-specific settings, for example `{ '(app)': { anchor: 'index' } }`.
    const groupSettings = pickAnchorSettings(value);
    if (groupSettings) {
      serialized[key] = groupSettings;
    }
  }

  return Object.keys(serialized).length ? serialized : null;
}

/**
 * Reads the settings of a layout that the server render inlined into the HTML document. Used on
 * web when async routes are enabled and the layout module has not loaded yet.
 */
export function readStaticLayoutSettings(contextKey: string): StaticLayoutSettings | undefined {
  return globalThis.__EXPO_ROUTER_LAYOUT_SETTINGS__?.[contextKey];
}
