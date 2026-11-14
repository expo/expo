import * as Updates from 'expo-updates';

// expo-updates persists extra params across launches, so the example stores its flag there.
const CRASH_ON_LAUNCH_PARAM = 'observe-tester-crash-on-launch';

export async function requestCrashOnNextLaunch(): Promise<void> {
  await Updates.setExtraParamAsync(CRASH_ON_LAUNCH_PARAM, 'true');
}

/**
 * Throws a fatal JS error soon after launch when the example requested it, so that expo-updates
 * error recovery handles the crash. The flag is cleared first, so the next launch does not crash.
 */
export async function crashOnLaunchIfRequested(): Promise<void> {
  const params = await Updates.getExtraParamsAsync();
  if (params[CRASH_ON_LAUNCH_PARAM] !== 'true') {
    return;
  }
  await Updates.setExtraParamAsync(CRASH_ON_LAUNCH_PARAM, null);
  // A timer callback reaches React Native's fatal error handler. An error thrown in this async
  // function would only reject its promise.
  setTimeout(() => {
    throw new Error('Sample crash on launch (observe-tester)');
  });
}
