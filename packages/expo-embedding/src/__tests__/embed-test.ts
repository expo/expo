import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

describe('Embedding native frameworks', () => {
  let root: string;
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'expo-embed-test-'));
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));

  function embed(names: string[]) {
    const sources = names.map((name) => {
      const path = join(root, 'sources', `${name}.framework`);
      mkdirSync(join(path, 'Headers'), { recursive: true });
      writeFileSync(join(path, name), name);
      return path;
    });
    execFileSync(
      '/bin/bash',
      [resolve(__dirname, '../../scripts/embed-frameworks.sh'), ...sources],
      {
        env: {
          ...process.env,
          PLATFORM_NAME: 'iphonesimulator',
          TARGET_BUILD_DIR: root,
          TARGET_TEMP_DIR: join(root, 'temp'),
          FRAMEWORKS_FOLDER_PATH: 'App.app/Frameworks',
          CODE_SIGNING_ALLOWED: 'NO',
        },
      }
    );
  }

  it('should copy frameworks without development headers', () => {
    embed(['Expo']);
    expect(readFileSync(join(root, 'App.app/Frameworks/Expo.framework/Expo'), 'utf8')).toBe('Expo');
    expect(existsSync(join(root, 'App.app/Frameworks/Expo.framework/Headers'))).toBe(false);
  });

  it('should remove a previously embedded dependency while preserving user frameworks', () => {
    const user = join(root, 'App.app/Frameworks/User.framework');
    mkdirSync(user, { recursive: true });
    embed(['Expo', 'ExpoSQLite']);
    embed(['Expo']);
    expect(existsSync(join(root, 'App.app/Frameworks/ExpoSQLite.framework'))).toBe(false);
    expect(existsSync(user)).toBe(true);
    expect(existsSync(join(root, 'App.app/Frameworks/Expo.framework'))).toBe(true);
  });
});
