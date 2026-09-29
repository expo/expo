import Constants from 'expo-constants';

import type { RouteNode } from '../Route';
import { getRoutes } from '../getRoutes';
import { serializeLayoutSettings, type StaticLayoutSettings } from '../layoutSettings';
import type { RequireContext } from '../types';

const cache = new WeakMap<RequireContext, Record<string, StaticLayoutSettings> | null>();

/**
 * Collects the anchor settings of every layout, keyed by the layout's context key, for the
 * server render to inline into the HTML document. The client reads them when async routes are
 * enabled and a layout module has not loaded when the route tree is built. Returns `null` when
 * no layout has anchor settings.
 */
export function collectStaticLayoutSettings(
  context: RequireContext
): Record<string, StaticLayoutSettings> | null {
  const cached = cache.get(context);
  if (cached !== undefined) {
    return cached;
  }

  const settings: Record<string, StaticLayoutSettings> = {};
  const routeNode = getRoutes(context, {
    ...Constants.expoConfig?.extra?.router,
    skipGenerated: true,
    ignoreEntryPoints: true,
    platform: 'web',
    preserveRedirectAndRewrites: true,
    importMode: 'sync',
  });
  if (routeNode) {
    collect(routeNode, settings);
  }

  const result = Object.keys(settings).length ? settings : null;
  cache.set(context, result);
  return result;
}

function collect(node: RouteNode, settings: Record<string, StaticLayoutSettings>) {
  if (node.type !== 'layout') {
    return;
  }
  if (!(node.contextKey in settings)) {
    const serialized = serializeLayoutSettings(node.loadRoute()?.unstable_settings);
    if (serialized) {
      settings[node.contextKey] = serialized;
    }
  }
  for (const child of node.children) {
    collect(child, settings);
  }
}
