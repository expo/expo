let enabled = false;

/**
 * Starts recording the performance marks of Expo Router navigation. Call it before the root
 * layout mounts, for example at the top level of the root `_layout` file.
 *
 * @experimental
 */
export function unstable_enablePerformanceIntegration() {
  enabled = true;
}

export function isEnabled() {
  return enabled;
}
