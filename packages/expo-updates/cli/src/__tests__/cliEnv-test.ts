import { getOriginalEnv } from '@expo/env';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

describe('CLI environment handoff', () => {
  let projectRoot: string;
  const cliPath = path.resolve(__dirname, '../../../bin/cli.js');

  beforeEach(() => {
    projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-updates-cli-env-'));
    fs.writeFileSync(path.join(projectRoot, 'package.json'), JSON.stringify({ name: 'test-app' }));
    fs.writeFileSync(
      path.join(projectRoot, 'app.config.js'),
      `module.exports = {
        name: 'test-app',
        slug: 'test-app',
        runtimeVersion: [
          process.env.NODE_ENV,
          process.env.DOTENV_MODE,
          process.env.SHELL_VALUE,
          process.env.__EXPO_CONFIG_MODE ?? 'consumed',
        ].join('|'),
      };`
    );
    for (const mode of ['development', 'production']) {
      fs.writeFileSync(
        path.join(projectRoot, `.env.${mode}`),
        `DOTENV_MODE=${mode}\nSHELL_VALUE=from-dotenv\n`
      );
    }
  });

  afterEach(() => {
    fs.rmSync(projectRoot, { recursive: true, force: true });
  });

  it.each([
    { parentMode: 'development', childMode: 'production' },
    { parentMode: 'production', childMode: 'development' },
  ])(
    'loads $childMode env files after inheriting $parentMode env values',
    ({ parentMode, childMode }) => {
      const stdout = execFileSync(
        process.execPath,
        [cliPath, 'runtimeversion:resolve', '--platform', 'android', '--workflow', 'managed'],
        {
          cwd: projectRoot,
          encoding: 'utf8',
          env: {
            ...getOriginalEnv(),
            EXPO_NO_DOTENV: '0',
            NODE_ENV: parentMode,
            DOTENV_MODE: parentMode,
            SHELL_VALUE: 'from-shell',
            __EXPO_ENV_LOADED: JSON.stringify(['DOTENV_MODE']),
            __EXPO_CONFIG_MODE: childMode,
          },
        }
      );

      expect(JSON.parse(stdout)).toEqual({
        runtimeVersion: `${childMode}|${childMode}|from-shell|consumed`,
        fingerprintSources: null,
        workflow: 'managed',
      });
    }
  );
});
