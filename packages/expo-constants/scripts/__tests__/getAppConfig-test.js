const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const scriptPath = path.resolve(__dirname, '../getAppConfig.js');

describe('getAppConfig', () => {
  let projectRoot;
  let destinationDir;

  beforeEach(() => {
    projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-constants-config-'));
    destinationDir = path.join(projectRoot, 'output');
    fs.mkdirSync(destinationDir);
    fs.writeFileSync(path.join(projectRoot, 'package.json'), '{}');
    fs.writeFileSync(
      path.join(projectRoot, 'app.config.js'),
      `module.exports = {
        name: 'test',
        slug: 'test',
        extra: {
          mode: process.env.NODE_ENV,
          configMode: process.env.__EXPO_CONFIG_MODE || 'not-set',
          value: process.env.EXPO_PUBLIC_MODE_VALUE,
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
  });

  afterEach(() => {
    fs.rmSync(projectRoot, { recursive: true, force: true });
  });

  it.each([
    {
      nodeEnv: 'production',
      nativeMode: 'production',
      configMode: 'development',
      mode: 'development',
    },
    {
      nodeEnv: 'development',
      nativeMode: 'development',
      configMode: 'production',
      mode: 'production',
    },
    {
      nodeEnv: 'production',
      nativeMode: 'development',
      configMode: undefined,
      mode: 'development',
    },
    { nodeEnv: 'development', nativeMode: 'production', configMode: undefined, mode: 'production' },
    { nodeEnv: 'development', nativeMode: undefined, configMode: undefined, mode: 'development' },
    { nodeEnv: 'production', nativeMode: undefined, configMode: undefined, mode: 'production' },
  ])(
    'loads $mode with NODE_ENV=$nodeEnv, argument=$nativeMode, and override=$configMode',
    ({ nodeEnv, nativeMode, configMode, mode }) => {
      const env = {
        ...process.env,
        NODE_ENV: nodeEnv,
        EXPO_PUBLIC_MODE_VALUE: 'parent-value',
        __EXPO_CONFIG_MODE: configMode,
        __EXPO_ENV_LOADED: JSON.stringify(['EXPO_PUBLIC_MODE_VALUE']),
      };
      delete env.EXPO_NO_DOTENV;
      delete env.EXPO_UNSAFE_DOTENV_KEYS;

      const fingerprintPath = path.join(destinationDir, 'app.fingerprint');
      fs.writeFileSync(fingerprintPath, JSON.stringify({ hash: 'existing-fingerprint' }));
      const args = [scriptPath, projectRoot, destinationDir];
      if (nativeMode) {
        args.push('ios', 'false', nativeMode);
      }
      const result = spawnSync(process.execPath, args, { env, encoding: 'utf8' });

      expect(result.stderr).toBe('');
      expect(result.status).toBe(0);
      expect(
        JSON.parse(fs.readFileSync(path.join(destinationDir, 'app.config'), 'utf8'))
      ).toMatchObject({
        extra: {
          mode,
          configMode: 'not-set',
          value: `${mode}-value`,
        },
      });
      if (nativeMode) {
        expect(fs.existsSync(fingerprintPath)).toBe(false);
      } else {
        expect(JSON.parse(fs.readFileSync(fingerprintPath, 'utf8')).hash).toBe(
          'existing-fingerprint'
        );
      }
    }
  );

  it('rejects an invalid config mode before writing app.config', () => {
    const result = spawnSync(process.execPath, [scriptPath, projectRoot, destinationDir], {
      env: { ...process.env, __EXPO_CONFIG_MODE: 'staging' },
      encoding: 'utf8',
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('Invalid __EXPO_CONFIG_MODE value: "staging"');
    expect(fs.existsSync(path.join(destinationDir, 'app.config'))).toBe(false);
  });
});
