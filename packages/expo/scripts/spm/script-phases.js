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

/**
 * Script phases for the autolinked module set. `modulePackageNames` is the npm
 * names of the modules RN autolinked this run; a phase is emitted only when its
 * owning module is among them.
 */
function scriptPhasesForModules(modulePackageNames) {
  const modules = new Set(modulePackageNames);
  const phases = [];

  if (modules.has('expo-constants')) {
    phases.push({
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
    });
  }

  return phases;
}

module.exports = { scriptPhasesForModules, APP_CONFIG_PHASE_ID, APP_CONFIG_OUTPUT };
