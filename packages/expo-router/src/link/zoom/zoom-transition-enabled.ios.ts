let enabled = true;

export function disableZoomTransition() {
  enabled = false;
}

export function isZoomTransitionEnabled() {
  return enabled;
}
