export const SUPPORTED_ROUTER_EVENTS_VERSION = 1;

let hasWarned = false;

export function isSupportedRouterEventsVersion(version: number | undefined): boolean {
  return version === undefined || version <= SUPPORTED_ROUTER_EVENTS_VERSION;
}

export function warnUnsupportedRouterEventsVersion(version: number): void {
  if (__DEV__ && !hasWarned) {
    hasWarned = true;
    console.warn(
      `[expo-observe] expo-router navigation events version ${version} is newer than supported version ${SUPPORTED_ROUTER_EVENTS_VERSION}; analytics listeners were not attached.`
    );
  }
}
