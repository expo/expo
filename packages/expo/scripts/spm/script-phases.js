/**
 * Build-time script phases contributed to RN's SwiftPM autolinking graph.
 *
 * SwiftPM has no equivalent of CocoaPods' `script_phase`, so RN's plugin
 * contract takes them as data (`scriptPhases`) and injects each as a real
 * `PBXShellScriptBuildPhase` on the app target at `spm add` / `spm update`.
 *
 * Gating is the plugin's responsibility: RN installs exactly what is returned,
 * so a phase is emitted only when the module that needs it is autolinked.
 *
 * The `script` bodies here must stay free of generation-time absolute paths —
 * a baked path goes stale in pnpm / hoisted stores — so they resolve node and
 * the owning package themselves at build time.
 */

'use strict';

// Stable ledger key AND the seed RN derives the phase's pbxproj UUID from, so
// changing it is a remove + re-add rather than an in-place update. Dot form:
// RN's contract rejects `:` and, in the currently published preview, `@` and `/`.
const APP_CONFIG_PHASE_ID = 'expo-constants.app-config';

const APP_CONFIG_OUTPUT =
  '$(TARGET_BUILD_DIR)/$(UNLOCALIZED_RESOURCES_FOLDER_PATH)/EXConstants.bundle/app.config';

// Mirrors what CocoaPods does through EXConstants.podspec's `script_phase`, with
// the three things CocoaPods supplied implicitly rebuilt for SwiftPM: node (no
// PODS_ROOT to find `.xcode.env` from), the project root (PROJECT_DIR is the
// app's `ios/`, not `ios/Pods`), and the resource bundle itself (there is no
// `resource_bundles` equivalent, so nothing creates EXConstants.bundle).
const APP_CONFIG_SCRIPT = `set -eo pipefail

# Resolve node the way RN's own phases do: app-local env files first, PATH last.
# \`.xcode.env\` may reference unset vars, so relax errexit while sourcing it.
if [ -z "\${NODE_BINARY:-}" ]; then
  set +e
  if [ -f "$SRCROOT/.xcode.env" ]; then . "$SRCROOT/.xcode.env"; fi
  if [ -f "$SRCROOT/.xcode.env.local" ]; then . "$SRCROOT/.xcode.env.local"; fi
  set -e
fi
if [ -z "\${NODE_BINARY:-}" ]; then
  NODE_BINARY="$(command -v node || true)"
fi
if [ -z "$NODE_BINARY" ]; then
  echo "error: expo-constants could not find node while generating the embedded app config. Set NODE_BINARY in $SRCROOT/.xcode.env — run: echo \\"export NODE_BINARY=\\$(command -v node)\\" >> \\"$SRCROOT/.xcode.env\\"" >&2
  exit 1
fi
export NODE_BINARY

export PROJECT_ROOT="\${PROJECT_ROOT:-$SRCROOT/..}"

# Resolve the package from the app at BUILD time; a path baked in at generation
# time dangles as soon as the store layout changes.
EXPO_CONSTANTS_DIR="$("$NODE_BINARY" --print "require('path').dirname(require.resolve('expo-constants/package.json', { paths: [process.argv[1]] }))" "$PROJECT_ROOT" 2>/dev/null || true)"
if [ -z "$EXPO_CONSTANTS_DIR" ] || [ ! -f "$EXPO_CONSTANTS_DIR/scripts/get-app-config-ios.sh" ]; then
  echo "error: expo-constants could not be resolved from $PROJECT_ROOT, so the embedded app config was not generated. Reinstall your dependencies, or remove expo-constants if it is no longer used." >&2
  exit 1
fi

# Where the shared script assembles EXConstants.bundle. Under CocoaPods this is
# the pod target's CONFIGURATION_BUILD_DIR; here the phase is on the app target,
# so point it at the app's own resources directory.
export EXPO_CONSTANTS_APP_CONFIG_DEST="$TARGET_BUILD_DIR/$UNLOCALIZED_RESOURCES_FOLDER_PATH"

# The shared script no-ops unless it is running inside the Pods project, to keep
# the classic and pod integrations from both writing app.config. SwiftPM injects
# exactly one phase, so opt out of that de-duplication.
export EXPO_CONSTANTS_ALLOW_NON_PODS=1

exec "$EXPO_CONSTANTS_DIR/scripts/get-app-config-ios.sh"
`;

const EXPO_MODULES_JSI_LAUNCHER_SCRIPT = `set -euo pipefail

if [ -z "\${NODE_BINARY:-}" ]; then
  set +eu
  if [ -f "$SRCROOT/.xcode.env" ]; then . "$SRCROOT/.xcode.env"; fi
  if [ -f "$SRCROOT/.xcode.env.local" ]; then . "$SRCROOT/.xcode.env.local"; fi
  set -eu
fi
NODE_BINARY="\${NODE_BINARY:-$(command -v node || true)}"
if [ -z "$NODE_BINARY" ]; then
  echo "error: ExpoModulesJSI could not be built because node was not found. The build uses node to find react-native and expo-modules-jsi. Set NODE_BINARY in $SRCROOT/.xcode.env, for example: echo \\"export NODE_BINARY=\\$(command -v node)\\" >> \\"$SRCROOT/.xcode.env\\"" >&2
  exit 1
fi

PROJECT_ROOT="\${PROJECT_ROOT:-$(cd "$SRCROOT/.." && pwd)}"

# expo-modules-jsi is a dependency of expo-modules-core, not of the app, so it is resolved through
# that chain: under pnpm it is not reachable from the app root.
RESOLVED="$("$NODE_BINARY" -e '
  const path = require("path");
  const dir = (name, from) => path.dirname(require.resolve(\`\${name}/package.json\`, { paths: [from] }));
  const root = process.argv[1];
  const core = dir("expo-modules-core", dir("expo", root));
  console.log(\`\${dir("react-native", root)}\\n\${dir("expo-modules-jsi", core)}\`);
' "$PROJECT_ROOT" || true)"
RN_DIR="$(printf '%s\\n' "$RESOLVED" | sed -n 1p)"
JSI_DIR="$(printf '%s\\n' "$RESOLVED" | sed -n 2p)"
if [ -z "$RN_DIR" ] || [ -z "$JSI_DIR" ]; then
  echo "error: ExpoModulesJSI could not be built because react-native, or expo-modules-jsi through expo and expo-modules-core, could not be resolved from $PROJECT_ROOT. The dependencies are not installed, or PROJECT_ROOT does not point at the app. Install the app's dependencies, then build again." >&2
  exit 1
fi
if [ ! -f "$JSI_DIR/apple/scripts/build-swiftpm-app-phase.sh" ]; then
  echo "error: ExpoModulesJSI could not be built because $JSI_DIR has no apple/scripts/build-swiftpm-app-phase.sh. The installed expo-modules-jsi is older than this version of expo. Update expo-modules-jsi by reinstalling the app's dependencies so they match this version of expo, then build again." >&2
  exit 1
fi

export RN_DIR
exec /bin/bash "$JSI_DIR/apple/scripts/build-swiftpm-app-phase.sh"
`;

/** Each phase, keyed by the npm package of the module that needs it. */
const SCRIPT_PHASES = [
  {
    packageName: 'expo-modules-jsi',
    phase: {
      id: 'expo-modules-jsi.build',
      name: 'Build ExpoModulesJSI',
      script: EXPO_MODULES_JSI_LAUNCHER_SCRIPT,
      // Source packages compile against the headers XCFramework alone; the app's own
      // sources and its link step need the real framework.
      position: 'beforeCompile',
      // Xcode cannot see the framework's inputs. build-xcframework.sh skips the build
      // when its source hash is unchanged; the copy and codesign run on every build.
      alwaysOutOfDate: true,
    },
  },
  {
    packageName: 'expo-constants',
    phase: {
      id: APP_CONFIG_PHASE_ID,
      name: 'Generate Expo app.config',
      script: APP_CONFIG_SCRIPT,
      // Must land after "Bundle React Native code and images": it writes into
      // the app bundle's resources directory.
      position: 'end',
      outputPaths: [APP_CONFIG_OUTPUT],
      // The config can come from app.json, app.config.js/ts, or env files, so
      // there is no input set Xcode can hash reliably — matching the podspec.
      alwaysOutOfDate: true,
    },
  },
];

/**
 * Script phases for the autolinked module set. `modulePackageNames` is the npm
 * names of the modules RN autolinked this run; a phase is emitted only when its
 * owning module is among them.
 */
function scriptPhasesForModules(modulePackageNames) {
  const modules = new Set(modulePackageNames);
  return SCRIPT_PHASES.filter(({ packageName }) => modules.has(packageName)).map(
    ({ phase }) => phase
  );
}

module.exports = { scriptPhasesForModules, APP_CONFIG_PHASE_ID, APP_CONFIG_OUTPUT };
