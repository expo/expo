const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const scriptPath = path.resolve(__dirname, '../get-app-config-ios.sh');

describe('get-app-config-ios.sh', () => {
  let projectRoot;
  let podsRoot;
  let destinationDir;

  beforeEach(() => {
    projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-constants-ios-'));
    podsRoot = path.join(projectRoot, 'ios', 'Pods');
    destinationDir = path.join(projectRoot, 'build', 'EXConstants.bundle');
    fs.mkdirSync(podsRoot, { recursive: true });
    fs.mkdirSync(destinationDir, { recursive: true });
    fs.writeFileSync(path.join(projectRoot, 'package.json'), '{}');
    const expoDir = path.join(projectRoot, 'node_modules', 'expo');
    fs.mkdirSync(expoDir, { recursive: true });
    fs.writeFileSync(
      path.join(expoDir, 'package.json'),
      JSON.stringify({ name: 'expo', exports: { './fingerprint': './fingerprint.js' } })
    );
    fs.writeFileSync(
      path.join(expoDir, 'fingerprint.js'),
      `exports.createFingerprintAsync = async (root, { platforms }) => ({
        hash: platforms[0] + '-fingerprint',
      });`
    );
    fs.writeFileSync(
      path.join(projectRoot, 'app.config.js'),
      `module.exports = {
        name: 'test',
        slug: 'test',
        extra: {
          mode: process.env.NODE_ENV,
          configMode: process.env.__EXPO_CONFIG_MODE || 'not-set',
          value: process.env.EXPO_PUBLIC_MODE_VALUE,
          envFile: process.env.ENV_FILE,
        },
      };`
    );
    fs.writeFileSync(
      path.join(projectRoot, '.env.development'),
      'EXPO_PUBLIC_MODE_VALUE=development-value\n'
    );
    fs.writeFileSync(
      path.join(projectRoot, '.env.production'),
      'EXPO_PUBLIC_MODE_VALUE=production-value\n'
    );
    fs.writeFileSync(
      path.join(projectRoot, 'ios', '.xcode.env'),
      'export NODE_BINARY="$TEST_NODE_BINARY"\n'
    );
  });

  afterEach(() => {
    fs.rmSync(projectRoot, { recursive: true, force: true });
  });

  it.each([
    { configuration: 'Debug', override: undefined, mode: 'development', bundleFormat: 'shallow' },
    { configuration: 'Release', override: undefined, mode: 'production', bundleFormat: 'shallow' },
    {
      configuration: 'DebugStaging',
      override: undefined,
      mode: 'development',
      bundleFormat: 'shallow',
    },
    { configuration: 'Staging', override: undefined, mode: 'production', bundleFormat: 'deep' },
    {
      configuration: 'Staging',
      override: 'development',
      mode: 'development',
      bundleFormat: 'shallow',
    },
    { configuration: 'Debug', override: 'production', mode: 'production', bundleFormat: 'shallow' },
    {
      configuration: 'Debug',
      override: undefined,
      updatesEnvironment: 'export CONFIGURATION=Release\n',
      mode: 'production',
      bundleFormat: 'shallow',
    },
    {
      configuration: 'Debug',
      override: 'development',
      updatesEnvironment: 'export CONFIGURATION=Release\n',
      mode: 'development',
      bundleFormat: 'shallow',
    },
    {
      configuration: 'Debug',
      override: undefined,
      updatesEnvironment: 'export CONFIGURATION=Release\n',
      baseEnvironment: 'export APP_CONFIGURATION=DebugStaging\n',
      localEnvironment: 'export CONFIGURATION="$APP_CONFIGURATION"\n',
      mode: 'development',
      bundleFormat: 'shallow',
    },
    {
      configuration: 'Debug',
      override: undefined,
      updatesEnvironment: 'export CONFIGURATION=Release\n',
      localEnvironment: '[ "$CONFIGURATION" = Debug ] && export DEBUG_OPTION=1\n',
      mode: 'production',
      bundleFormat: 'shallow',
    },
    {
      configuration: 'Debug',
      override: undefined,
      updatesEnvironment: 'export CONFIGURATION=Release\n',
      localEnvironment: 'if false | true; then export CONFIGURATION=DebugStaging; fi\n',
      mode: 'development',
      bundleFormat: 'shallow',
    },
  ])('loads $mode for $configuration with override=$override', (testCase) => {
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
    const env = {
      ...process.env,
      BUNDLE_FORMAT: testCase.bundleFormat,
      CONFIGURATION: testCase.configuration,
      CONFIGURATION_BUILD_DIR: path.dirname(destinationDir),
      NODE_ENV: 'development',
      EX_UPDATES_NATIVE_DEBUG: undefined,
      EXPO_SKIP_FINGERPRINT_EMBED: undefined,
      ENV_FILE: 'inherited-env-file',
      PODS_ROOT: podsRoot,
      PROJECT_DIR: podsRoot,
      PROJECT_ROOT: projectRoot,
      TEST_NODE_BINARY: process.execPath,
      EXPO_PUBLIC_MODE_VALUE: 'parent-value',
      __EXPO_CONFIG_MODE: testCase.override,
      __EXPO_ENV_LOADED: JSON.stringify(['EXPO_PUBLIC_MODE_VALUE']),
    };
    delete env.EXPO_NO_DOTENV;
    delete env.EXPO_UNSAFE_DOTENV_KEYS;

    const result = spawnSync('/bin/bash', [scriptPath], { encoding: 'utf8', env });

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    const outputDir =
      testCase.bundleFormat === 'deep'
        ? path.join(destinationDir, 'Contents', 'Resources')
        : destinationDir;
    expect(JSON.parse(fs.readFileSync(path.join(outputDir, 'app.config'), 'utf8'))).toMatchObject({
      extra: {
        mode: testCase.mode,
        configMode: 'not-set',
        value: `${testCase.mode}-value`,
        envFile: 'inherited-env-file',
      },
    });
    const fingerprintPath = path.join(outputDir, 'app.fingerprint');
    if (testCase.configuration.includes('Debug')) {
      expect(JSON.parse(fs.readFileSync(fingerprintPath, 'utf8')).hash).toBe('ios-fingerprint');
    } else {
      expect(fs.existsSync(fingerprintPath)).toBe(false);
    }
  });
});
