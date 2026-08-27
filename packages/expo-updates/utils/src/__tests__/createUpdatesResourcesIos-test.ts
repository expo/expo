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
      easBuild: '',
      inheritedMode: '',
      mode: 'development',
      metroDev: 'true',
    },
    {
      build: 'a Release build',
      configuration: 'Release',
      easBuild: '',
      inheritedMode: '',
      mode: 'production',
      metroDev: 'false',
    },
    {
      build: 'an EAS Debug build',
      configuration: 'Debug',
      easBuild: 'true',
      inheritedMode: '',
      mode: 'development',
      metroDev: 'true',
    },
    {
      build: 'a build with an inherited config mode',
      configuration: 'Release',
      easBuild: 'true',
      inheritedMode: 'development',
      mode: 'development',
      metroDev: 'false',
    },
  ])('passes the config and Metro modes for $build', (testCase) => {
    const { configuration, easBuild, inheritedMode, mode, metroDev } = testCase;
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
        CONFIGURATION: configuration,
        CONFIGURATION_BUILD_DIR: path.join(projectRoot, 'build'),
        EAS_BUILD: easBuild,
        ENTRY_FILE: 'index.js',
        FAKE_NODE_BINARY: fakeNode,
        FORCE_BUNDLING: '1',
        PODS_ROOT: podsRoot,
        PROJECT_DIR: podsRoot,
        PROJECT_ROOT: projectRoot,
        SKIP_BUNDLING: '',
        __EXPO_CONFIG_MODE: inheritedMode,
      },
    });

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    const capturedValues = fs.readFileSync(captureFile, 'utf8').trim().split('\n');
    expect(capturedValues[0]).toBe(mode);
    expect(capturedValues.at(-1)).toBe(metroDev);
  });
});
