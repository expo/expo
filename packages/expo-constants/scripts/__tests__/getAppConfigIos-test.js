const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const scriptPath = path.resolve(__dirname, '../get-app-config-ios.sh');

describe('get-app-config-ios.sh', () => {
  let projectRoot;

  beforeEach(() => {
    projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-constants-ios-'));
  });

  afterEach(() => {
    fs.rmSync(projectRoot, { recursive: true, force: true });
  });

  it.each([
    {
      build: 'a Debug build',
      configuration: 'Debug',
      inheritedMode: '',
      expectedMode: 'development',
    },
    {
      build: 'a custom Debug build',
      configuration: 'DebugStaging',
      inheritedMode: '',
      expectedMode: 'development',
    },
    {
      build: 'a Release build',
      configuration: 'Release',
      inheritedMode: '',
      expectedMode: 'production',
    },
    {
      build: 'a build with an inherited mode',
      configuration: 'Release',
      inheritedMode: 'development',
      expectedMode: 'development',
    },
  ])('passes the config mode for $build', (testCase) => {
    const captureFile = path.join(projectRoot, 'capture.txt');
    const fakeNode = path.join(projectRoot, 'node');
    const podsRoot = path.join(projectRoot, 'ios', 'Pods');
    fs.mkdirSync(podsRoot, { recursive: true });
    fs.writeFileSync(
      path.join(projectRoot, 'ios', '.xcode.env'),
      'export NODE_BINARY="$FAKE_NODE_BINARY"\n'
    );
    fs.writeFileSync(
      fakeNode,
      '#!/bin/bash\nprintf \'%s\\n\' "$__EXPO_CONFIG_MODE" "$@" > "$CAPTURE_FILE"\n',
      { mode: 0o755 }
    );

    const result = spawnSync('/bin/bash', [scriptPath], {
      encoding: 'utf8',
      env: {
        ...process.env,
        BUNDLE_FORMAT: 'shallow',
        CAPTURE_FILE: captureFile,
        CONFIGURATION: testCase.configuration,
        CONFIGURATION_BUILD_DIR: path.join(projectRoot, 'build'),
        FAKE_NODE_BINARY: fakeNode,
        PODS_ROOT: podsRoot,
        PROJECT_DIR: podsRoot,
        PROJECT_ROOT: projectRoot,
        __EXPO_CONFIG_MODE: testCase.inheritedMode,
      },
    });

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(fs.readFileSync(captureFile, 'utf8').trim().split('\n')[0]).toBe(testCase.expectedMode);
  });
});
