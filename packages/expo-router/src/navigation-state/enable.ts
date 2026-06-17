// R-Phase A — the opt-in flag for the new navigation state model (Decisions R-3).
//
// Call `enableNewStateModel()` once at app start, before expo-router renders. The flag is read at
// render and per-dispatch (never at module-eval), so it only needs to be set before `<ExpoRoot>`
// mounts — which avoids the import-order race an export swap would have. One-way by design (mirrors
// `screensFeatureFlags`). Note: a Fast-Refresh of this module resets it; toggling needs a full reload.

let enabled = false;

export function enableNewStateModel(): void {
  enabled = true;
}

export function isNewStateModelEnabled(): boolean {
  return enabled;
}

/** Test-only: clear the one-way flag. jest-expo does not reset modules between tests in a file, so
 * render tests that opt in must reset in `afterEach` to keep the flag-off path green (Decisions R-3). */
export function __resetNewStateModelForTests(): void {
  enabled = false;
}
