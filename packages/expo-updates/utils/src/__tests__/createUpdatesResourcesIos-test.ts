import { spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const scriptPath = path.resolve(__dirname, '../../../scripts/create-updates-resources-ios.sh');

describe('create-updates-resources-ios.sh', () => {
  let projectRoot: string;

  beforeEach(() => {
    projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-updates-ios-'));
  });

  afterEach(() => {
    fs.rmSync(projectRoot, { force: true, recursive: true });
  });

  it.each([
    {
      build: 'a Debug build',
      configuration: 'Debug',
      inheritedMode: undefined,
      forceBundling: '1',
      mode: 'development',
      metroDev: 'true',
      resourcesMode: 'all',
    },
    {
      build: 'a custom Debug build',
      configuration: 'DebugStaging',
      inheritedMode: undefined,
      forceBundling: '',
      mode: 'development',
      metroDev: 'true',
      resourcesMode: 'only-fingerprint',
    },
    {
      build: 'a lowercase debug configuration',
      configuration: 'debugStaging',
      inheritedMode: undefined,
      forceBundling: '',
      mode: 'production',
      metroDev: 'false',
      resourcesMode: 'all',
    },
    {
      build: 'a Release build',
      configuration: 'Release',
      inheritedMode: undefined,
      forceBundling: '',
      mode: 'production',
      metroDev: 'false',
      resourcesMode: 'all',
    },
    {
      build: 'a Debug build with EAS_BUILD set',
      configuration: 'Debug',
      easBuild: 'true',
      inheritedMode: undefined,
      forceBundling: '1',
      mode: 'development',
      metroDev: 'true',
      resourcesMode: 'all',
    },
    {
      build: 'a build with an inherited config mode',
      configuration: 'Release',
      inheritedMode: 'development',
      forceBundling: '',
      mode: 'development',
      metroDev: 'false',
      resourcesMode: 'all',
    },
    {
      build: 'a Debug build with a production override',
      configuration: 'Debug',
      inheritedMode: 'production',
      forceBundling: '',
      mode: 'production',
      metroDev: 'true',
      resourcesMode: 'only-fingerprint',
    },
    {
      build: 'a custom configuration with a development override',
      configuration: 'Staging',
      inheritedMode: 'development',
      forceBundling: '',
      mode: 'development',
      metroDev: 'false',
      resourcesMode: 'all',
    },
    {
      build: 'native debugging with generated production bundle settings',
      configuration: 'Debug',
      inheritedMode: undefined,
      forceBundling: '',
      updatesEnvironment:
        'export CONFIGURATION=Release\nexport FORCE_BUNDLING=1\nunset SKIP_BUNDLING\n',
      mode: 'production',
      metroDev: 'false',
      resourcesMode: 'all',
    },
    {
      build: 'native debugging with an inherited development override',
      configuration: 'Debug',
      inheritedMode: 'development',
      forceBundling: '',
      updatesEnvironment:
        'export CONFIGURATION=Release\nexport FORCE_BUNDLING=1\nunset SKIP_BUNDLING\n',
      mode: 'development',
      metroDev: 'false',
      resourcesMode: 'all',
    },
    {
      build: 'native debugging with a local configuration override',
      configuration: 'Debug',
      inheritedMode: undefined,
      forceBundling: '',
      updatesEnvironment:
        'export CONFIGURATION=Release\nexport FORCE_BUNDLING=1\nunset SKIP_BUNDLING\n',
      baseEnvironment: 'export APP_CONFIGURATION=DebugStaging\n',
      localEnvironment: 'export CONFIGURATION="$APP_CONFIGURATION"\n',
      mode: 'development',
      metroDev: 'true',
      resourcesMode: 'all',
    },
    {
      build: 'native debugging with a false optional condition in local settings',
      configuration: 'Debug',
      inheritedMode: undefined,
      forceBundling: '',
      updatesEnvironment:
        'export CONFIGURATION=Release\nexport FORCE_BUNDLING=1\nunset SKIP_BUNDLING\n',
      localEnvironment: '[ "$CONFIGURATION" = Debug ] && export DEBUG_OPTION=1\n',
      mode: 'production',
      metroDev: 'false',
      resourcesMode: 'all',
    },
    {
      build: 'native debugging with a pipeline condition in local settings',
      configuration: 'Debug',
      inheritedMode: undefined,
      forceBundling: '',
      updatesEnvironment:
        'export CONFIGURATION=Release\nexport FORCE_BUNDLING=1\nunset SKIP_BUNDLING\n',
      localEnvironment: 'if false | true; then export CONFIGURATION=DebugStaging; fi\n',
      mode: 'development',
      metroDev: 'true',
      resourcesMode: 'all',
    },
  ])('passes the config and Metro modes for $build', (testCase) => {
    const { configuration, easBuild, inheritedMode, forceBundling, mode, metroDev, resourcesMode } =
      testCase;
    const captureFile = path.join(projectRoot, 'capture.txt');
    const fakeNode = path.join(projectRoot, 'node');
    const podsRoot = path.join(projectRoot, 'ios', 'Pods');
    fs.mkdirSync(podsRoot, { recursive: true });
    fs.writeFileSync(
      path.join(projectRoot, 'ios', '.xcode.env'),
      'export NODE_BINARY="$FAKE_NODE_BINARY"\n'
    );
    if (testCase.baseEnvironment) {
      fs.appendFileSync(path.join(projectRoot, 'ios', '.xcode.env'), testCase.baseEnvironment);
    }
    if (testCase.updatesEnvironment) {
      fs.writeFileSync(
        path.join(projectRoot, 'ios', '.xcode.env.updates'),
        testCase.updatesEnvironment
      );
    }
    if (testCase.localEnvironment) {
      fs.writeFileSync(
        path.join(projectRoot, 'ios', '.xcode.env.local'),
        testCase.localEnvironment
      );
    }
    fs.writeFileSync(
      fakeNode,
      '#!/bin/bash\n[[ "$ENV_FILE" == "inherited-env-file" ]] || exit 1\nprintf \'%s\\n\' "$__EXPO_CONFIG_MODE" "$@" > "$CAPTURE_FILE"\n',
      { mode: 0o755 }
    );

    const result = spawnSync('/bin/bash', [scriptPath], {
      encoding: 'utf8',
      env: {
        ...process.env,
        BUNDLE_FORMAT: 'shallow',
        CAPTURE_FILE: captureFile,
        CONFIGURATION: configuration,
        CONFIGURATION_BUILD_DIR: path.join(projectRoot, 'build'),
        EAS_BUILD: easBuild ?? '',
        ENTRY_FILE: 'index.js',
        FAKE_NODE_BINARY: fakeNode,
        FORCE_BUNDLING: forceBundling,
        EX_UPDATES_NATIVE_DEBUG: undefined,
        ENV_FILE: 'inherited-env-file',
        NODE_ENV: mode === 'development' ? 'production' : 'development',
        PODS_ROOT: podsRoot,
        PROJECT_DIR: podsRoot,
        PROJECT_ROOT: projectRoot,
        SKIP_BUNDLING: testCase.updatesEnvironment ? '1' : '',
        __EXPO_CONFIG_MODE: inheritedMode,
      },
    });

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    const capturedValues = fs.readFileSync(captureFile, 'utf8').trim().split('\n');
    expect(capturedValues.slice(-3)).toEqual([resourcesMode, 'index.js', metroDev]);
    expect(capturedValues[0]).toBe(mode);
    expect(capturedValues[4]).toBe(path.join(projectRoot, 'build', 'EXUpdates.bundle'));
  });

  it.each(['', 'staging'])('rejects the invalid config mode %j in Node', (mode) => {
    const podsRoot = path.join(projectRoot, 'ios', 'Pods');
    fs.mkdirSync(podsRoot, { recursive: true });
    fs.writeFileSync(path.join(projectRoot, 'package.json'), '{}');
    fs.writeFileSync(
      path.join(projectRoot, 'ios', '.xcode.env'),
      'export NODE_BINARY="$TEST_NODE_BINARY"\n'
    );

    const result = spawnSync('/bin/bash', [scriptPath], {
      encoding: 'utf8',
      env: {
        ...process.env,
        BUNDLE_FORMAT: 'shallow',
        CONFIGURATION: 'Debug',
        CONFIGURATION_BUILD_DIR: path.join(projectRoot, 'build'),
        ENTRY_FILE: 'index.js',
        FORCE_BUNDLING: '',
        NODE_ENV: 'production',
        PODS_ROOT: podsRoot,
        PROJECT_DIR: podsRoot,
        PROJECT_ROOT: projectRoot,
        SKIP_BUNDLING: '',
        TEST_NODE_BINARY: process.execPath,
        __EXPO_CONFIG_MODE: mode,
      },
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      mode
        ? `Invalid __EXPO_CONFIG_MODE value: "${mode}". Use "development" or "production".`
        : 'Must provide a config mode'
    );
  });
});
