'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const { scriptPhasesForModules } = require('../script-phases');

const APP_CONFIG_ID = 'expo-constants.app-config';

describe('scriptPhasesForModules', () => {
  it('emits nothing when expo-constants is not autolinked', () => {
    expect(scriptPhasesForModules([])).toEqual([]);
    expect(scriptPhasesForModules(['expo', 'expo-font'])).toEqual([]);
  });

  it('emits the app.config phase when expo-constants is autolinked', () => {
    const phases = scriptPhasesForModules(['expo', 'expo-constants']);
    expect(phases).toHaveLength(1);
    expect(phases[0]).toMatchObject({
      id: APP_CONFIG_ID,
      position: 'end',
      alwaysOutOfDate: true,
    });
    expect(phases[0].name).toBeTruthy();
  });

  // The phase must run AFTER "Bundle React Native code and images", because it
  // writes into the app bundle's resources directory.
  it('positions the phase at the end of the build', () => {
    const [phase] = scriptPhasesForModules(['expo-constants']);
    expect(phase.position).toBe('end');
  });

  it('declares the generated app.config as an output', () => {
    const [phase] = scriptPhasesForModules(['expo-constants']);
    expect(phase.outputPaths).toEqual([
      '$(TARGET_BUILD_DIR)/$(UNLOCALIZED_RESOURCES_FOLDER_PATH)/EXConstants.bundle/app.config',
    ]);
  });

  // A generation-time absolute path goes stale in pnpm / hoisted stores, so the
  // script must resolve expo-constants itself at build time.
  it('bakes no host-specific absolute path into the script', () => {
    const [phase] = scriptPhasesForModules(['expo-constants']);
    expect(phase.script).not.toMatch(/\/Users\//);
    expect(phase.script).not.toMatch(/node_modules/);
    expect(phase.script).toContain("require.resolve('expo-constants/package.json'");
  });

  // Under SwiftPM there is no CocoaPods, so the script has to be told where the
  // project root and the destination bundle are, and node has to be resolved
  // without PODS_ROOT.
  it('supplies the SwiftPM environment the shared script needs', () => {
    const [phase] = scriptPhasesForModules(['expo-constants']);
    expect(phase.script).toContain('EXPO_CONSTANTS_ALLOW_NON_PODS=1');
    expect(phase.script).toContain('EXPO_CONSTANTS_APP_CONFIG_DEST=');
    expect(phase.script).toContain('PROJECT_ROOT=');
    expect(phase.script).toContain('.xcode.env');
  });

  it('is stable across calls (same id, same script)', () => {
    const a = scriptPhasesForModules(['expo-constants']);
    const b = scriptPhasesForModules(['expo-constants']);
    expect(a).toEqual(b);
  });

  it('accepts the module list in any order and ignores duplicates', () => {
    const once = scriptPhasesForModules(['expo-constants']);
    const twice = scriptPhasesForModules(['expo-constants', 'expo', 'expo-constants']);
    expect(twice).toEqual(once);
  });
});

describe('the ExpoModulesJSI build phase', () => {
  const JSI_BUILD_ID = 'expo-modules-jsi.build';
  const PACKAGE_SCRIPT = 'apple/scripts/build-swiftpm-app-phase.sh';
  const PACKAGE_SCRIPT_PATH = path.join(
    __dirname,
    '..',
    '..',
    '..',
    '..',
    'expo-modules-jsi',
    PACKAGE_SCRIPT
  );
  const jsiPhase = (modules) => scriptPhasesForModules(modules).find((p) => p.id === JSI_BUILD_ID);

  it('is emitted only when expo-modules-jsi is autolinked', () => {
    expect(jsiPhase(['expo', 'expo-modules-core'])).toBeUndefined();
    expect(jsiPhase(['expo', 'expo-modules-core', 'expo-modules-jsi'])).toBeDefined();
  });

  // Source packages compile against the headers XCFramework only; the app's own sources
  // and its link step need the real framework, so the phase runs before they compile.
  // It tracks its own inputs, so Xcode must run it on every build.
  it('builds before the app target compiles, on every build', () => {
    expect(jsiPhase(['expo-modules-jsi'])).toMatchObject({
      name: 'Build ExpoModulesJSI',
      position: 'beforeCompile',
      alwaysOutOfDate: true,
    });
  });

  describe('launcher', () => {
    const { script } = jsiPhase(['expo-modules-jsi']) ?? { script: '' };

    it('is valid bash with no host-specific path baked in', () => {
      execFileSync('bash', ['-n'], { input: script });
      expect(script).not.toMatch(/\/Users\//);
      expect(script).not.toMatch(/node_modules/);
      expect(script).not.toMatch(/SPIKE/i);
    });

    // Under pnpm, expo-modules-jsi is not reachable from the app root.
    it('resolves expo-modules-jsi through expo and expo-modules-core', () => {
      expect(script).toContain('dir("expo-modules-core", dir("expo", root))');
      expect(script).toContain('dir("expo-modules-jsi", core)');
      expect(script).toContain('dir("react-native", root)');
    });

    it('execs the build script shipped in expo-modules-jsi', () => {
      expect(script).toContain(`exec "$JSI_DIR/${PACKAGE_SCRIPT}"`);
      expect(script).toContain(`[ ! -f "$JSI_DIR/${PACKAGE_SCRIPT}" ]`);
      expect(script).toMatch(/export [^\n]*RN_DIR/);
    });

    it('leaves the build steps to the package script', () => {
      expect(script).not.toContain('rsync');
      expect(script).not.toContain('stage_link');
      expect(script).not.toContain('codesign');
      expect(script).not.toContain('build-xcframework.sh');
    });
  });

  describe('package script', () => {
    it('ships in expo-modules-jsi as an executable bash script', () => {
      fs.accessSync(PACKAGE_SCRIPT_PATH, fs.constants.X_OK);
      execFileSync('bash', ['-n', PACKAGE_SCRIPT_PATH]);
    });

    it('builds, copies, embeds and signs the framework', () => {
      const body = fs.readFileSync(PACKAGE_SCRIPT_PATH, 'utf8');
      expect(body).toContain('"$JSI_DIR/apple/scripts/build-xcframework.sh"');
      expect(body).toContain('$BUILT_PRODUCTS_DIR/ExpoModulesJSI.framework/');
      expect(body).toContain(
        'EMBEDDED="$TARGET_BUILD_DIR/$FRAMEWORKS_FOLDER_PATH/ExpoModulesJSI.framework"'
      );
      expect(body).toContain('/usr/bin/codesign');
    });

    // Inside node_modules the package directory may be read-only and is shared by every
    // build folder, so all build state lives under the build folder's OBJROOT.
    it('keeps the build of expo-modules-jsi under the build folder', () => {
      const body = fs.readFileSync(PACKAGE_SCRIPT_PATH, 'utf8');
      expect(body).toContain('JSI_ROOT="$OBJROOT/ExpoModulesJSI"');
      expect(body).toContain('EXPO_CUSTOM_BUILD_ROOT="$JSI_ROOT/custom-build"');
    });

    it('does not resolve node or packages itself', () => {
      const body = fs.readFileSync(PACKAGE_SCRIPT_PATH, 'utf8');
      expect(body).not.toContain('NODE_BINARY');
      expect(body).not.toContain('require.resolve');
    });
  });
});
