import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const script = path.resolve(__dirname, '../../../scripts/ios/bundle.sh');
let projectRoot: string;

describe('Embedding brownfield bundles', () => {
  beforeEach(() => {
    projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'brownfield bundle '));
    const reactNative = path.join(projectRoot, 'node_modules/react-native');
    fs.mkdirSync(path.join(reactNative, 'scripts'), { recursive: true });
    fs.mkdirSync(path.join(projectRoot, 'ios'));
    fs.writeFileSync(path.join(reactNative, 'package.json'), '{"name":"react-native"}');
    fs.writeFileSync(
      path.join(reactNative, 'scripts/react-native-xcode.sh'),
      'test -z "$SKIP_BUNDLING" && test "$FORCE_BUNDLING" = 1 || exit 10\n' +
        'printf "%s\\n" "$ENTRY_FILE" "$BUNDLE_COMMAND" "$CONFIGURATION"\n'
    );
    fs.writeFileSync(
      path.join(projectRoot, 'ios/.xcode.env.local'),
      `export NODE_BINARY="${process.execPath}"\nexport SKIP_BUNDLING=1\n`
    );
  });

  afterEach(() => {
    fs.rmSync(projectRoot, { recursive: true, force: true });
  });

  it.each(['Debug', 'Release'])(
    'should bundle %s even when local settings skip bundling',
    (configuration) => {
      const output = execFileSync('/bin/bash', [script], {
        cwd: path.join(projectRoot, 'ios'),
        env: {
          ...process.env,
          PROJECT_ROOT: projectRoot,
          PROJECT_DIR: path.join(projectRoot, 'ios'),
          CONFIGURATION: configuration,
          PLATFORM_NAME: 'iphonesimulator',
          ENTRY_FILE: 'features.js',
          CLI_PATH: '/unused/expo-cli',
          BUNDLE_COMMAND: '',
        },
        encoding: 'utf8',
      });

      expect(output.trim().split('\n')).toEqual(['features.js', 'export:embed', configuration]);
    }
  );

  it('should propagate a bundler failure to Xcode', () => {
    fs.writeFileSync(
      path.join(projectRoot, 'node_modules/react-native/scripts/react-native-xcode.sh'),
      'exit 42\n'
    );

    expect(() =>
      execFileSync('/bin/bash', [script], {
        cwd: projectRoot,
        env: {
          ...process.env,
          PROJECT_ROOT: projectRoot,
          PROJECT_DIR: path.join(projectRoot, 'ios'),
          ENTRY_FILE: 'features.js',
          CLI_PATH: '/unused/expo-cli',
        },
        stdio: 'pipe',
      })
    ).toThrow(expect.objectContaining({ status: 42 }));
  });
});
