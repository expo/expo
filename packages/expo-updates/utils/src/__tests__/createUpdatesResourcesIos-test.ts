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
      forceBundling: '1',
      metroDev: 'true',
      resourcesMode: 'all',
    },
    {
      build: 'a custom Debug build',
      configuration: 'DebugStaging',
      forceBundling: '',
      metroDev: 'true',
      resourcesMode: 'only-fingerprint',
    },
    {
      build: 'a lowercase debug configuration',
      configuration: 'debugStaging',
      forceBundling: '',
      metroDev: 'false',
      resourcesMode: 'all',
    },
    {
      build: 'a Release build',
      configuration: 'Release',
      forceBundling: '',
      metroDev: 'false',
      resourcesMode: 'all',
    },
    {
      build: 'a Debug build with EAS_BUILD set',
      configuration: 'Debug',
      easBuild: 'true',
      forceBundling: '1',
      metroDev: 'true',
      resourcesMode: 'all',
    },
    {
      build: 'native debugging with generated production bundle settings',
      configuration: 'Debug',
      forceBundling: '',
      updatesEnvironment:
        'export CONFIGURATION=Release\nexport FORCE_BUNDLING=1\nunset SKIP_BUNDLING\n',
      metroDev: 'false',
      resourcesMode: 'all',
    },
    {
      build: 'native debugging with a local configuration override',
      configuration: 'Debug',
      forceBundling: '',
      updatesEnvironment:
        'export CONFIGURATION=Release\nexport FORCE_BUNDLING=1\nunset SKIP_BUNDLING\n',
      baseEnvironment: 'export APP_CONFIGURATION=DebugStaging\n',
      localEnvironment: 'export CONFIGURATION="$APP_CONFIGURATION"\n',
      metroDev: 'true',
      resourcesMode: 'all',
    },
    {
      build: 'native debugging with a false optional condition in local settings',
      configuration: 'Debug',
      forceBundling: '',
      updatesEnvironment:
        'export CONFIGURATION=Release\nexport FORCE_BUNDLING=1\nunset SKIP_BUNDLING\n',
      localEnvironment: '[ "$CONFIGURATION" = Debug ] && export DEBUG_OPTION=1\n',
      metroDev: 'false',
      resourcesMode: 'all',
    },
    {
      build: 'native debugging with a pipeline condition in local settings',
      configuration: 'Debug',
      forceBundling: '',
      updatesEnvironment:
        'export CONFIGURATION=Release\nexport FORCE_BUNDLING=1\nunset SKIP_BUNDLING\n',
      localEnvironment: 'if false | true; then export CONFIGURATION=DebugStaging; fi\n',
      metroDev: 'true',
      resourcesMode: 'all',
    },
  ])('passes the native build mode for $build', (testCase) => {
    const { configuration, easBuild, forceBundling, metroDev, resourcesMode } = testCase;
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
      '#!/bin/bash\n[[ "$ENV_FILE" == "inherited-env-file" ]] || exit 1\nprintf \'%s\\n\' "$@" > "$CAPTURE_FILE"\n',
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
        NODE_ENV: metroDev === 'true' ? 'production' : 'development',
        PODS_ROOT: podsRoot,
        PROJECT_DIR: podsRoot,
        PROJECT_ROOT: projectRoot,
        SKIP_BUNDLING: testCase.updatesEnvironment ? '1' : '',
      },
    });

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    const capturedValues = fs.readFileSync(captureFile, 'utf8').trim().split('\n');
    expect(capturedValues.slice(-3)).toEqual([resourcesMode, 'index.js', metroDev]);
    expect(capturedValues[3]).toBe(path.join(projectRoot, 'build', 'EXUpdates.bundle'));
  });
});
