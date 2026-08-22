// @ref llp/0005-runtime-loop-tools.rfc.md
// Deciding whether the app to navigate is Expo Go, which uses a different deep-link shape
// (`exp://<host>/--/<route>`) than a development build (`<scheme>://<route>`).
//
// Pure: every input is a fact the caller read from the command line, the dev server, or the
// project, so the whole precedence order is unit-testable.

/** Expo Go application ids, per platform. */
export const EXPO_GO_APP_IDS = ['host.exp.Exponent', 'host.exp.exponent'];

export interface ExpoGoDecisionInput {
  /** Application id passed with `--app-id`, which the user knows better than we do. */
  appIdOverride?: string | null;
  /** Application ids the dev server reported for the connected apps. Empty when unknown. */
  targetAppIds: string[];
  /** The project has `ios/` or `android/` checked in, so it runs a build of its own. */
  hasNativeDirs: boolean;
  /** `expo-dev-client` is a dependency, so the project runs a development build. */
  usesDevClient: boolean;
}

export interface ExpoGoDecision {
  isExpoGo: boolean;
  /** Why the target was decided that way, printed with the resolved URL. */
  reason: string;
}

/**
 * Decide whether the deep link targets Expo Go.
 *
 * Precedence, strongest evidence first: the `--app-id` flag, then the app actually connected to
 * the dev server, then the shape of the project.
 */
export function decideExpoGoTarget({
  appIdOverride,
  targetAppIds,
  hasNativeDirs,
  usesDevClient,
}: ExpoGoDecisionInput): ExpoGoDecision {
  if (appIdOverride) {
    const isExpoGo = EXPO_GO_APP_IDS.includes(appIdOverride);
    return {
      isExpoGo,
      reason: isExpoGo
        ? `--app-id names Expo Go (${appIdOverride})`
        : `--app-id names a development build (${appIdOverride})`,
    };
  }

  const expoGoTarget = targetAppIds.find((appId) => EXPO_GO_APP_IDS.includes(appId));
  if (expoGoTarget) {
    return {
      isExpoGo: true,
      reason: `the app connected to the dev server is Expo Go (${expoGoTarget})`,
    };
  }
  if (targetAppIds.length > 0) {
    return {
      isExpoGo: false,
      reason: `the app connected to the dev server is a development build (${targetAppIds[0]})`,
    };
  }

  if (hasNativeDirs) {
    return {
      isExpoGo: false,
      reason:
        'no app is connected to the dev server, and the project has native directories checked in',
    };
  }
  if (usesDevClient) {
    return {
      isExpoGo: false,
      reason: 'no app is connected to the dev server, and the project depends on expo-dev-client',
    };
  }
  return {
    isExpoGo: true,
    reason:
      'no app is connected to the dev server, and the project has no native directories and no expo-dev-client dependency, so Expo Go is the default target',
  };
}
