let enabled = process.env.EXPO_OS === 'ios';

export function disableZoomTransition() {
  enabled = false;
}

export function isZoomTransitionEnabled() {
  return enabled;
}
