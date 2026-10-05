import { getValidInitialRoute, type LoadedRoute, type RouteNode } from './Route';

const warnedDeprecatedLayouts = new WeakSet<RouteNode>();

/**
 * Reads the anchor from a layout's `unstable_settings`, preferring the group-specific one.
 * `groupName` is returned only when the group-specific anchor was used, for error messages.
 */
function resolveAnchorFromSettings(
  settings: LoadedRoute['unstable_settings'],
  node: RouteNode
): { anchor?: string; groupName?: string } {
  const { groupName } = node;
  if (!settings) {
    return {};
  }
  let anchor: string | undefined;
  try {
    if (
      process.env.NODE_ENV !== 'production' &&
      !warnedDeprecatedLayouts.has(node) &&
      (settings.initialRouteName !== undefined ||
        settings[groupName ?? '']?.initialRouteName !== undefined)
    ) {
      // Navigators read the anchor on every render, so warn once per layout.
      warnedDeprecatedLayouts.add(node);
      console.warn(
        '`unstable_settings.initialRouteName` is deprecated. Use `unstable_settings.anchor` instead.'
      );
    }
    anchor = settings.anchor ?? settings.initialRouteName;
  } catch (error: any) {
    if (error instanceof Error) {
      if (!error.message.match(/You cannot dot into a client module/)) {
        throw error;
      }
    }
  }

  const groupAnchor = groupName
    ? (settings[groupName]?.anchor ?? settings[groupName]?.initialRouteName)
    : undefined;
  return groupAnchor ? { anchor: groupAnchor, groupName } : { anchor };
}

/**
 * Returns the validated anchor route name of a layout. Call it only after the layout module
 * has loaded, for example while the layout's navigator renders.
 */
export function getLayoutAnchor(node: RouteNode | null): string | undefined {
  // A navigator can also render inside a route, which has no anchor.
  if (node?.type !== 'layout') {
    return undefined;
  }
  const loaded = node.loadRoute();
  if (loaded && 'then' in loaded) {
    if (process.env.NODE_ENV !== 'production') {
      throw new Error(
        `The layout "${node.contextKey}" was read before its module finished loading, so its anchor is unknown. This is likely a bug in expo-router. Please report it at https://github.com/expo/expo/issues.`
      );
    }
    return undefined;
  }
  const settings = resolveAnchorFromSettings(loaded?.unstable_settings, node);
  return getValidInitialRoute(node, settings.anchor, settings.groupName)?.route;
}
