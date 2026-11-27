'use strict';

const { execFileSync, spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
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
    let tmp;
    let srcRoot;
    let rnDir;
    let jsiDir;

    // pnpm layout: expo-modules-jsi is reachable only from expo-modules-core's real
    // location in the store, not from the app root.
    beforeEach(() => {
      tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'expo-jsi-launcher-')));
      const app = path.join(tmp, 'app');
      const store = path.join(app, 'node_modules', '.pnpm', 'expo-modules-core', 'node_modules');
      const writePackage = (dir, name) => {
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name }));
        return dir;
      };
      srcRoot = path.join(app, 'ios');
      fs.mkdirSync(srcRoot, { recursive: true });
      rnDir = writePackage(path.join(app, 'node_modules', 'react-native'), 'react-native');
      const expoDir = writePackage(path.join(app, 'node_modules', 'expo'), 'expo');
      const coreDir = writePackage(path.join(store, 'expo-modules-core'), 'expo-modules-core');
      fs.mkdirSync(path.join(expoDir, 'node_modules'));
      fs.symlinkSync(coreDir, path.join(expoDir, 'node_modules', 'expo-modules-core'));
      jsiDir = writePackage(path.join(store, 'expo-modules-jsi'), 'expo-modules-jsi');
      const stub = path.join(jsiDir, PACKAGE_SCRIPT);
      fs.mkdirSync(path.dirname(stub), { recursive: true });
      // Not executable, as after a publish that drops the mode bit.
      fs.writeFileSync(stub, 'echo "RN_DIR=$RN_DIR"\necho "SCRIPT=$0"\n', { mode: 0o644 });
    });

    afterEach(() => {
      fs.rmSync(tmp, { recursive: true, force: true });
    });

    const runLauncher = (env) =>
      spawnSync('bash', ['-c', script], {
        // Xcode runs the phase from the project folder. Inside packages/expo, node would
        // resolve `expo` to this package itself.
        cwd: srcRoot,
        encoding: 'utf8',
        env: {
          HOME: tmp,
          PATH: process.env.PATH,
          SRCROOT: srcRoot,
          NODE_BINARY: process.execPath,
          ...env,
        },
      });

    it('is valid bash with no host-specific path baked in', () => {
      execFileSync('bash', ['-n'], { input: script });
      expect(script).not.toMatch(/\/Users\//);
      expect(script).not.toMatch(/node_modules/);
      expect(script).not.toMatch(/SPIKE/i);
    });

    it('runs the package script with RN_DIR set, even without its executable bit', () => {
      const result = runLauncher();
      expect(result.stderr).toBe('');
      expect(result.status).toBe(0);
      expect(result.stdout).toContain(`RN_DIR=${fs.realpathSync(rnDir)}\n`);
      expect(result.stdout).toContain(`SCRIPT=${path.join(jsiDir, PACKAGE_SCRIPT)}\n`);
    });

    it('fails with a clear error when expo-modules-jsi has no package script', () => {
      fs.rmSync(path.join(jsiDir, PACKAGE_SCRIPT));
      const result = runLauncher();
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain(`has no ${PACKAGE_SCRIPT}`);
    });

    it('fails with a clear error when expo-modules-jsi cannot be resolved', () => {
      fs.rmSync(jsiDir, { recursive: true });
      const result = runLauncher();
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain('could not be resolved');
    });

    const nodeOnSystemPath = ['/usr/bin/node', '/bin/node'].some((p) => fs.existsSync(p));
    // Skipped where node is installed in /usr/bin or /bin: the case cannot be set up there.
    (nodeOnSystemPath ? it.skip : it)('fails with a clear error when node is not found', () => {
      const result = runLauncher({ PATH: '/usr/bin:/bin', NODE_BINARY: undefined });
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain('node was not found');
    });
  });

  describe('package script', () => {
    it('ships in expo-modules-jsi as an executable bash script', () => {
      fs.accessSync(PACKAGE_SCRIPT_PATH, fs.constants.X_OK);
      execFileSync('bash', ['-n', PACKAGE_SCRIPT_PATH]);
    });

    // pnpm publish drops the executable bit from every file not listed here.
    it('keeps its executable bit when expo-modules-jsi is published', () => {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(PACKAGE_SCRIPT_PATH, '..', '..', '..', 'package.json'), 'utf8')
      );
      expect(packageJson.publishConfig.executableFiles).toContain(`./${PACKAGE_SCRIPT}`);
    });

    describe('when run', () => {
      let tmp;

      beforeEach(() => {
        tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-jsi-phase-'));
      });

      afterEach(() => {
        fs.rmSync(tmp, { recursive: true, force: true });
      });

      const runPackageScript = (env) =>
        spawnSync('bash', [PACKAGE_SCRIPT_PATH], {
          encoding: 'utf8',
          env: { PATH: process.env.PATH, RN_DIR: tmp, ...env },
        });

      it('rejects a missing platform with a clear error', () => {
        const result = runPackageScript();
        expect(result.status).not.toBe(0);
        expect(result.stderr).toContain('cannot be built for the platform');
        expect(result.stderr).not.toContain('unbound variable');
      });

      it("reads React Native's headers from the slice being built", () => {
        const reactHeaders = path.join(
          tmp,
          'build/xcframeworks/ReactNativeHeaders.xcframework/ios-arm64_x86_64-simulator/Headers'
        );
        fs.mkdirSync(path.join(reactHeaders, 'hermes'), { recursive: true });
        fs.writeFileSync(path.join(reactHeaders, 'hermes', 'hermes.h'), '');
        const result = runPackageScript({
          PLATFORM_NAME: 'iphonesimulator',
          SRCROOT: tmp,
          OBJROOT: path.join(tmp, 'obj'),
        });
        expect(result.status).not.toBe(0);
        expect(result.stderr).toContain(
          'ReactNativeDependenciesHeaders.xcframework/ios-arm64_x86_64-simulator/Headers/folly is missing'
        );
        expect(result.stderr).toContain(`node ${tmp}/scripts/setup-apple-spm.js update`);
      });

      // plutil, which reads React Native's version, exists only on macOS.
      (process.platform === 'darwin' ? describe : describe.skip)(
        'with a stub build-xcframework.sh',
        () => {
          const SLICE = 'ios-arm64_x86_64-simulator';
          let script;
          let dsymFolder;

          beforeEach(() => {
            const scriptsDir = path.join(tmp, 'pkg', 'apple', 'scripts');
            fs.mkdirSync(scriptsDir, { recursive: true });
            script = path.join(scriptsDir, 'build-swiftpm-app-phase.sh');
            fs.copyFileSync(PACKAGE_SCRIPT_PATH, script);
            fs.writeFileSync(
              path.join(scriptsDir, 'build-xcframework.sh'),
              [
                '#!/bin/bash',
                'set -euo pipefail',
                ': "${PODS_ROOT:?}" "${EXPO_CUSTOM_BUILD_ROOT:?}"',
                `SLICE_DIR="$EXPO_CUSTOM_BUILD_ROOT/Products/ExpoModulesJSI.xcframework/${SLICE}"`,
                'mkdir -p "$SLICE_DIR/ExpoModulesJSI.framework"',
                'touch "$SLICE_DIR/ExpoModulesJSI.framework/ExpoModulesJSI" "$SLICE_DIR/ExpoModulesJSI.framework/Info.plist"',
                'if [ -n "${STUB_WITH_DSYM:-}" ]; then',
                '  mkdir -p "$SLICE_DIR/ExpoModulesJSI.framework.dSYM/Contents"',
                '  touch "$SLICE_DIR/ExpoModulesJSI.framework.dSYM/Contents/Info.plist"',
                'fi',
                '',
              ].join('\n'),
              { mode: 0o755 }
            );
            const xcframeworks = path.join(tmp, 'build', 'xcframeworks');
            const reactHeaders = path.join(
              xcframeworks,
              'ReactNativeHeaders.xcframework',
              SLICE,
              'Headers'
            );
            fs.mkdirSync(path.join(reactHeaders, 'hermes'), { recursive: true });
            fs.writeFileSync(path.join(reactHeaders, 'hermes', 'hermes.h'), '');
            fs.mkdirSync(
              path.join(
                xcframeworks,
                'ReactNativeDependenciesHeaders.xcframework',
                SLICE,
                'Headers',
                'folly'
              ),
              { recursive: true }
            );
            fs.writeFileSync(
              path.join(tmp, 'package.json'),
              JSON.stringify({ name: 'react-native', version: '0.88.0' })
            );
            dsymFolder = path.join(tmp, 'dsyms');
          });

          const runStubbedScript = (env) =>
            spawnSync('bash', [script], {
              encoding: 'utf8',
              env: {
                PATH: process.env.PATH,
                RN_DIR: tmp,
                PLATFORM_NAME: 'iphonesimulator',
                SRCROOT: tmp,
                OBJROOT: path.join(tmp, 'obj'),
                BUILT_PRODUCTS_DIR: path.join(tmp, 'products'),
                TARGET_BUILD_DIR: path.join(tmp, 'target'),
                FRAMEWORKS_FOLDER_PATH: 'Frameworks',
                CODE_SIGNING_ALLOWED: 'NO',
                DWARF_DSYM_FOLDER_PATH: dsymFolder,
                ...env,
              },
            });

          const expectFrameworkCopied = () => {
            for (const dir of [
              path.join(tmp, 'products'),
              path.join(tmp, 'target', 'Frameworks'),
            ]) {
              expect(
                fs.existsSync(path.join(dir, 'ExpoModulesJSI.framework', 'ExpoModulesJSI'))
              ).toBe(true);
            }
          };

          it("copies the framework's dSYM into the app's dSYM folder", () => {
            const result = runStubbedScript({ STUB_WITH_DSYM: '1' });
            expect(result.stderr).toBe('');
            expect(result.status).toBe(0);
            expectFrameworkCopied();
            expect(
              fs.existsSync(
                path.join(dsymFolder, 'ExpoModulesJSI.framework.dSYM', 'Contents', 'Info.plist')
              )
            ).toBe(true);
          });

          it('copies no dSYM when the build produced none', () => {
            const result = runStubbedScript();
            expect(result.stderr).toBe('');
            expect(result.status).toBe(0);
            expectFrameworkCopied();
            expect(fs.existsSync(path.join(dsymFolder, 'ExpoModulesJSI.framework.dSYM'))).toBe(
              false
            );
          });

          it('copies no dSYM when DWARF_DSYM_FOLDER_PATH is empty', () => {
            const result = runStubbedScript({ STUB_WITH_DSYM: '1', DWARF_DSYM_FOLDER_PATH: '' });
            expect(result.stderr).not.toContain('unbound variable');
            expect(result.status).toBe(0);
            expectFrameworkCopied();
            expect(fs.existsSync(dsymFolder)).toBe(false);
          });
        }
      );
    });

    it('builds, copies, embeds and signs the framework', () => {
      const body = fs.readFileSync(PACKAGE_SCRIPT_PATH, 'utf8');
      expect(body).toContain('"$JSI_DIR/apple/scripts/build-xcframework.sh"');
      expect(body).toContain('$BUILT_PRODUCTS_DIR/ExpoModulesJSI.framework/');
      expect(body).toContain(
        'EMBEDDED="$TARGET_BUILD_DIR/$FRAMEWORKS_FOLDER_PATH/ExpoModulesJSI.framework"'
      );
      expect(body).toContain('/usr/bin/codesign');
      expect(body).toContain('DWARF_DSYM_FOLDER_PATH');
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
