import { reportCaughtError } from './reportCaughtError';

/**
 * The options of `HermesInternal.enablePromiseRejectionTracker`. Hermes calls `onUnhandled` when a
 * rejected promise still has no handler after a short delay, and `onHandled` when a handler is
 * attached later to a promise that `onUnhandled` already received.
 */
type RejectionTrackerOptions = {
  allRejections?: boolean;
  onUnhandled?: (id: number, rejection: unknown) => void;
  onHandled?: (id: number, rejection: unknown) => void;
};

type HermesInternalType = {
  hasPromise?: () => boolean;
  enablePromiseRejectionTracker?: (options: RejectionTrackerOptions) => void;
};

let installed = false;
let enabled = true;

/**
 * Enables or disables reporting of unhandled promise rejections.
 */
export function setRejectionTrackerEnabled(value: boolean): void {
  enabled = value;
}

/**
 * Reports promise rejections that no handler catches as non-fatal errors with the
 * `unhandledRejection` source. Does nothing in development. Only the first call installs the
 * tracker.
 */
export function installRejectionTracker(): void {
  if (installed) {
    return;
  }
  if (__DEV__) {
    // React Native and `@expo/metro-runtime` install their own trackers in development to show
    // rejections in LogBox. Hermes keeps only the options of the last call, so this tracker would
    // replace theirs.
    return;
  }
  const hermes = (globalThis as { HermesInternal?: HermesInternalType | null }).HermesInternal;
  if (!hermes?.hasPromise?.() || typeof hermes.enablePromiseRejectionTracker !== 'function') {
    // Hermes tracks only its own `Promise`. When `hasPromise()` is false, React Native replaces
    // the global `Promise` with a polyfill that Hermes doesn't track.
    return;
  }
  installed = true;

  hermes.enablePromiseRejectionTracker({
    // Without this, Hermes passes only `ReferenceError`, `TypeError`, and `RangeError` rejections.
    allRejections: true,
    onUnhandled(id, rejection) {
      if (enabled) {
        reportCaughtError(rejection, 'unhandledRejection');
      }
    },
    // Without this, Hermes prints a warning when a handler is attached to a reported rejection.
    onHandled() {},
  });
}
