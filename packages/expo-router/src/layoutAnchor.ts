import { getValidInitialRoute, type LoadedRoute, type RouteNode } from './Route';

const anchors = new WeakMap<RouteNode, string | undefined>();

/**
 * Reads the anchor from a layout's `unstable_settings`, preferring the group-specific one.
 * `groupName` is returned only when the group-specific anchor was used, for error messages.
 */
function resolveAnchorFromSettings(
  settings: LoadedRoute['unstable_settings'],
  groupName: string | undefined
): { anchor?: string; groupName?: string } {
  if (!settings) {
    return {};
  }
  let anchor: string | undefined;
  try {
    if (
      process.env.NODE_ENV !== 'production' &&
      (settings.initialRouteName !== undefined ||
        settings[groupName ?? '']?.initialRouteName !== undefined)
    ) {
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
  if (anchors.has(node)) {
    return anchors.get(node);
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
  const settings = resolveAnchorFromSettings(loaded?.unstable_settings, node.anchorGroupName);
  const anchor = getValidInitialRoute(node, settings.anchor, settings.groupName)?.route;
  anchors.set(node, anchor);
  return anchor;
}

/**
 * Returns the anchor of a layout without loading it. Returns `undefined` when the layout has no
 * anchor or has not rendered yet.
 */
export function peekLayoutAnchor(node: RouteNode): string | undefined {
  return anchors.get(node);
}
