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

  it.each(['development', 'production'])('loads the %s env before app config', (mode) => {
    const env = {
      ...process.env,
      NODE_ENV: mode === 'development' ? 'production' : 'development',
      EXPO_PUBLIC_MODE_VALUE: 'parent-value',
      __EXPO_CONFIG_MODE: mode,
      __EXPO_ENV_LOADED: JSON.stringify(['EXPO_PUBLIC_MODE_VALUE']),
    };
    delete env.EXPO_NO_DOTENV;
    delete env.EXPO_UNSAFE_DOTENV_KEYS;

    const result = spawnSync(process.execPath, [scriptPath, projectRoot, destinationDir], {
      env,
      encoding: 'utf8',
    });

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
  });

  it('requires a config mode', () => {
    const env = { ...process.env };
    delete env.__EXPO_CONFIG_MODE;

    const result = spawnSync(process.execPath, [scriptPath, projectRoot, destinationDir], {
      env,
      encoding: 'utf8',
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('Must provide a config mode');
  });
});
