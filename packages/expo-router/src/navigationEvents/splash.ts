import * as SplashScreen from '../views/Splash';

let splashScreenAnimationFrame: number | undefined;
let hasAttemptedToHideSplash = false;

// Hide the splash screen once, on the first navigation-ready. Deferred a frame because
// `navigationRef.isReady` is sometimes not yet true when the state is first read.
export function handleSplashScreenOnReady() {
  if (hasAttemptedToHideSplash) {
    return;
  }
  hasAttemptedToHideSplash = true;
  splashScreenAnimationFrame = requestAnimationFrame(() => {
    SplashScreen._internal_maybeHideAsync?.();
  });
}

// Cancel a pending splash-hide frame — e.g. the container unmounts before it runs.
export function cancelSplashScreenAnimationFrame() {
  if (splashScreenAnimationFrame != null) {
    cancelAnimationFrame(splashScreenAnimationFrame);
    splashScreenAnimationFrame = undefined;
  }
}
