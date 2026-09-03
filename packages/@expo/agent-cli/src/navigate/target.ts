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
  /**
   * Whether the project can run in Expo Go at all, or null when nothing read the project.
   *
   * @ref llp/0005-runtime-loop-tools.rfc.md §Expo Go is only a target for a project that fits in it
   * `ProjectState.expoGo.compatible`, from `checkExpoGoCompatibilityAsync` — the same fact `status`
   * prints and the plan engine branches on. Expo Go ships a fixed native runtime, so a project with
   * a native module that runtime does not contain cannot run there whatever the other four facts
   * say, and a `false` here is the strongest statement about the *project* that exists.
   *
   * **Null is not `false`.** A caller that could not read the project answers null and gets the
   * behaviour that was here before this input existed; treating an unreadable project as
   * incompatible would refuse runs that work.
   */
  expoGoCompatible?: boolean | null;
}

export interface ExpoGoDecision {
  isExpoGo: boolean;
  /** Why the target was decided that way, printed with the resolved URL. */
  reason: string;
  /**
   * Whether the target was **established** rather than inferred from the project's shape.
   *
   * The difference decides whether a connect URL may be printed as one line. `exp://<host>` is the
   * Expo Go form and `<scheme>://expo-development-client/?url=…` is the development build's, and
   * they are not interchangeable — so a caller that has to *guess* which application is meant
   * prints both, labelled, rather than one of them [decided, 2026-08-26].
   *
   * False in exactly one branch: nothing is connected, no `--app-id` was passed, the project does
   * not depend on `expo-dev-client`, its Expo Go compatibility is **unknown**, and a native
   * directory is checked in. That project has a build of its own **and** may still be opened in
   * Expo Go, and nothing here can tell which happened. Every other branch has something that
   * settles it — the flag, the connected app, the dependency, a compatibility check that came back
   * `false`, or the absence of any dev-build machinery at all.
   */
  certain: boolean;
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
  expoGoCompatible = null,
}: ExpoGoDecisionInput): ExpoGoDecision {
  if (appIdOverride) {
    const isExpoGo = EXPO_GO_APP_IDS.includes(appIdOverride);
    return {
      isExpoGo,
      reason: isExpoGo
        ? `--app-id names Expo Go (${appIdOverride})`
        : `--app-id names a development build (${appIdOverride})`,
      certain: true,
    };
  }

  const expoGoTarget = targetAppIds.find((appId) => EXPO_GO_APP_IDS.includes(appId));
  if (expoGoTarget) {
    return {
      isExpoGo: true,
      reason: `the app connected to the dev server is Expo Go (${expoGoTarget})`,
      certain: true,
    };
  }
  if (targetAppIds.length > 0) {
    return {
      isExpoGo: false,
      reason: `the app connected to the dev server is a development build (${targetAppIds[0]})`,
      certain: true,
    };
  }

  // The dependency is the project's own statement that it runs a development build, and it is the
  // fallback the deep-link contract names, so it settles the question.
  if (usesDevClient) {
    return {
      isExpoGo: false,
      reason: 'no app is connected to the dev server, and the project depends on expo-dev-client',
      certain: true,
    };
  }
  // @ref llp/0005-runtime-loop-tools.rfc.md §Expo Go is only a target for a project that fits in it
  //
  // Above the native-directory guess below, because it is a stronger read of the same conclusion:
  // the compatibility check counts a checked-in native directory among its own reasons, and it also
  // catches the two this function could never see — an unbundled native module, and a config plugin
  // that changes the native projects. Below the two observations above it, because those are facts
  // about what *will open the link* rather than about the project.
  //
  // Without this the last branch of this function answered `isExpoGo: true`, `certain: true` for a
  // project `status` and the plan engine already called `needs-dev-client`. `smoke` opened `exp://`,
  // Expo Go answered the debugger, and the gate reported `passed` at exit 0 [observed — iOS 26.5
  // simulator, a CNG project with a podspec-shipping dependency, 2026-09-03].
  if (expoGoCompatible === false) {
    return {
      isExpoGo: false,
      reason:
        'no app is connected to the dev server, and this project cannot run in Expo Go — its native code is not in that runtime',
      certain: true,
    };
  }

  // A checked-in native directory says a build of this project exists. It does not say that build
  // is what is about to open the link — a bare project with no unbundled native module still runs
  // in Expo Go — so this is the one branch that guesses, and it says so.
  if (hasNativeDirs) {
    return {
      isExpoGo: false,
      reason:
        'no app is connected to the dev server, and the project has native directories checked in — which does not rule Expo Go out',
      certain: false,
    };
  }
  return {
    isExpoGo: true,
    reason:
      'no app is connected to the dev server, and the project has no native directories and no expo-dev-client dependency, so Expo Go is the default target',
    certain: true,
  };
}
