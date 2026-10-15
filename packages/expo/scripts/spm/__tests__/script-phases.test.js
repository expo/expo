'use strict';

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
