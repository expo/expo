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
