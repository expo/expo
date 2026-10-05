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
    { configuration: 'Debug', mode: 'development' },
    { configuration: 'Release', mode: 'production' },
  ])('passes $mode for $configuration', ({ configuration, mode }) => {
    const captureFile = path.join(projectRoot, 'capture.txt');
    const fakeNode = path.join(projectRoot, 'node');
    const podsRoot = path.join(projectRoot, 'ios', 'Pods');
    fs.mkdirSync(podsRoot, { recursive: true });
    fs.writeFileSync(
      path.join(projectRoot, 'ios', '.xcode.env'),
      'export NODE_BINARY="$FAKE_NODE_BINARY"\n'
    );
    fs.writeFileSync(fakeNode, '#!/bin/bash\nprintf \'%s\\n\' "$@" > "$CAPTURE_FILE"\n', {
      mode: 0o755,
    });

    const result = spawnSync('/bin/bash', [scriptPath], {
      encoding: 'utf8',
      env: {
        ...process.env,
        BUNDLE_FORMAT: 'shallow',
        CAPTURE_FILE: captureFile,
        CONFIGURATION: configuration,
        CONFIGURATION_BUILD_DIR: path.join(projectRoot, 'build'),
        FAKE_NODE_BINARY: fakeNode,
        PODS_ROOT: podsRoot,
        PROJECT_DIR: podsRoot,
        PROJECT_ROOT: projectRoot,
      },
    });

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    const capturedValues = fs.readFileSync(captureFile, 'utf8').trim().split('\n');
    expect(capturedValues.pop()).toBe(mode);
  });
});
