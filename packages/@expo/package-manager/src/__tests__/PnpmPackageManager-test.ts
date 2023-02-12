/* eslint-env jest */
import spawnAsync from '@expo/spawn-async';
import { vol } from 'memfs';
import path from 'path';
import split from 'split';
import { PassThrough } from 'stream';

import { PnpmPackageManager, PnpmStdoutTransform } from '../PnpmPackageManager';

jest.mock('fs');
jest.mock('@expo/spawn-async', () => {
  const actualModule = jest.requireActual('@expo/spawn-async');

  return {
    __esModule: true,
    ...actualModule,
    // minimal implementation is needed here because the packager manager depends on the child property to exist.
    default: jest.fn((_command, _args, _options) => {
      const promise = new Promise((resolve, _reject) => resolve({}));
      // @ts-ignore: TypeScript isn't aware the Promise constructor argument runs synchronously
      promise.child = {};
      return promise;
    }),
  };
});

const mockedSpawnAsync = spawnAsync as jest.MockedFunction<typeof spawnAsync>;

describe('PnpmPackageManager', () => {
  const projectRoot = '/project/with-pnpm';

  describe('installAsync', () => {
    it('runs normal installation', async () => {
      const pnpm = new PnpmPackageManager({ cwd: projectRoot });
      await pnpm.installAsync();

      expect(spawnAsync).toBeCalledWith(
        'pnpm',
        ['install'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });
  });

  describe('addWithParametersAsync', () => {
    it('adds a single package with custom parameters', async () => {
      const pnpm = new PnpmPackageManager({ cwd: projectRoot });
      await pnpm.addWithParametersAsync(['@babel/core'], ['--save-peer']);

      expect(spawnAsync).toBeCalledWith(
        'pnpm',
        ['add', '--save-peer', '@babel/core'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('adds multiple packages with custom parameters', async () => {
      const pnpm = new PnpmPackageManager({ cwd: projectRoot });
      await pnpm.addWithParametersAsync(['@babel/core', '@babel/runtime'], ['--save-peer']);

      expect(spawnAsync).toBeCalledWith(
        'pnpm',
        ['add', '--save-peer', '@babel/core', '@babel/runtime'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('installs project without packages', async () => {
      const pnpm = new PnpmPackageManager({ cwd: projectRoot });
      await pnpm.addWithParametersAsync([], ['--save-optional']);

      expect(spawnAsync).toBeCalledWith(
        'pnpm',
        ['install'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });
  });

  describe('addAsync', () => {
    it('adds a single package to dependencies', async () => {
      const pnpm = new PnpmPackageManager({ cwd: projectRoot });
      await pnpm.addAsync('@react-navigation/native');

      expect(spawnAsync).toBeCalledWith(
        'pnpm',
        ['add', '@react-navigation/native'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('adds multiple packages to dependencies', async () => {
      const pnpm = new PnpmPackageManager({ cwd: projectRoot });
      await pnpm.addAsync('@react-navigation/native', '@react-navigation/drawer');

      expect(spawnAsync).toBeCalledWith(
        'pnpm',
        ['add', '@react-navigation/native', '@react-navigation/drawer'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('installs project without packages', async () => {
      const pnpm = new PnpmPackageManager({ cwd: projectRoot });
      await pnpm.addAsync();

      expect(spawnAsync).toBeCalledWith(
        'pnpm',
        ['install'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });
  });

  describe('addDevAsync', () => {
    it('adds a single package to dev dependencies', async () => {
      const pnpm = new PnpmPackageManager({ cwd: projectRoot });
      await pnpm.addDevAsync('eslint');

      expect(spawnAsync).toBeCalledWith(
        'pnpm',
        ['add', '--save-dev', 'eslint'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('adds multiple packages to dev dependencies', async () => {
      const pnpm = new PnpmPackageManager({ cwd: projectRoot });
      await pnpm.addDevAsync('eslint', 'prettier');

      expect(spawnAsync).toBeCalledWith(
        'pnpm',
        ['add', '--save-dev', 'eslint', 'prettier'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('installs project without packages', async () => {
      const pnpm = new PnpmPackageManager({ cwd: projectRoot });
      await pnpm.addDevAsync();

      expect(spawnAsync).toBeCalledWith(
        'pnpm',
        ['install'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });
  });

  describe('addGlobalAsync', () => {
    it('adds a single package globally', async () => {
      const pnpm = new PnpmPackageManager({ cwd: projectRoot });
      await pnpm.addGlobalAsync('expo-cli@^5');

      expect(spawnAsync).toBeCalledWith(
        'pnpm',
        ['add', '--global', 'expo-cli@^5'],
        expect.anything()
      );
    });

    it('adds multiple packages globally', async () => {
      const pnpm = new PnpmPackageManager({ cwd: projectRoot });
      await pnpm.addGlobalAsync('expo-cli@^5', 'eas-cli');

      expect(spawnAsync).toBeCalledWith(
        'pnpm',
        ['add', '--global', 'expo-cli@^5', 'eas-cli'],
        expect.anything()
      );
    });
  });

  describe('removeAsync', () => {
    it('removes a single package', async () => {
      const pnpm = new PnpmPackageManager({ cwd: projectRoot });
      await pnpm.removeAsync('metro');

      expect(spawnAsync).toBeCalledWith(
        'pnpm',
        ['remove', 'metro'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('removes multiple packages', async () => {
      const pnpm = new PnpmPackageManager({ cwd: projectRoot });
      await pnpm.removeAsync('metro', 'jest-haste-map');

      expect(spawnAsync).toBeCalledWith(
        'pnpm',
        ['remove', 'metro', 'jest-haste-map'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });
  });

  describe('versionAsync', () => {
    it('returns version from pnpm', async () => {
      mockedSpawnAsync.mockResolvedValue({ stdout: '7.0.0\n' } as any);

      const pnpm = new PnpmPackageManager({ cwd: projectRoot });

      expect(await pnpm.versionAsync()).toBe('7.0.0');
      expect(spawnAsync).toBeCalledWith('pnpm', ['--version'], expect.anything());
    });
  });

  describe('getConfigAsync', () => {
    it('returns a configuration key from pnpm', async () => {
      mockedSpawnAsync.mockResolvedValue({ stdout: 'https://custom.registry.org/\n' } as any);

      const pnpm = new PnpmPackageManager({ cwd: projectRoot });

      expect(await pnpm.getConfigAsync('registry')).toBe('https://custom.registry.org/');
      expect(spawnAsync).toBeCalledWith('pnpm', ['config', 'get', 'registry'], expect.anything());
    });
  });

  describe('removeLockfileAsync', () => {
    afterEach(() => vol.reset());

    it('removes pnpm-lock.yaml file relative to cwd', async () => {
      vol.fromJSON({
        [path.join(projectRoot, 'package.json')]: '{}',
        [path.join(projectRoot, 'pnpm-lock.yaml')]: '',
      });

      const pnpm = new PnpmPackageManager({ cwd: projectRoot });
      await pnpm.removeLockfileAsync();

      expect(vol.existsSync(path.join(projectRoot, 'pnpm-lock.yaml'))).toBe(false);
    });

    it('skips removing non-existing pnpm-lock.yaml', async () => {
      vol.fromJSON({
        [path.join(projectRoot, 'package.json')]: '{}',
      });

      const pnpm = new PnpmPackageManager({ cwd: projectRoot });
      await pnpm.removeLockfileAsync();

      expect(vol.existsSync(path.join(projectRoot, 'pnpm-lock.yaml'))).toBe(false);
    });

    it('fails when no cwd is provided', async () => {
      const pnpm = new PnpmPackageManager({ cwd: undefined });
      await expect(pnpm.removeLockfileAsync()).rejects.toThrow('cwd required');
    });
  });

  describe('cleanAsync', () => {
    afterEach(() => vol.reset());

    it('removes node_modules folder relative to cwd', async () => {
      vol.fromJSON({
        [path.join(projectRoot, 'package.json')]: '{}',
        [path.join(projectRoot, 'node_modules/expo/package.json')]: '{}',
      });

      const pnpm = new PnpmPackageManager({ cwd: projectRoot });
      await pnpm.cleanAsync();

      expect(vol.existsSync(path.join(projectRoot, 'node_modules'))).toBe(false);
    });

    it('skips removing non-existing node_modules folder', async () => {
      vol.fromJSON({
        [path.join(projectRoot, 'package.json')]: '{}',
      });

      const pnpm = new PnpmPackageManager({ cwd: projectRoot });
      await pnpm.cleanAsync();

      expect(vol.existsSync(path.join(projectRoot, 'node_modules'))).toBe(false);
    });

    it('fails when no cwd is provided', async () => {
      const pnpm = new PnpmPackageManager({ cwd: undefined });
      await expect(pnpm.cleanAsync()).rejects.toThrow('cwd required');
    });
  });
});

describe('PnpmStdoutTransform', () => {
  const installNormal = `
Progress: resolved 34, reused 23, downloaded 0, added 0
Already up-to-date

Progress: resolved 35, reused 24, downloaded 0, added 0, done  
  `;

  /* eslint-disable no-irregular-whitespace */
  const installPeerDepsWarning = `
Progress: resolved 0, reused 1, downloaded 0, added 0

 WARN  deprecated uuid@3.4.0: Please upgrade  to version 7 or higher.  Older versions may use Math.random() in certain circumstances, which is known to be problematic.  See https://v8.dev/blog/math-random for details.
 WARN  deprecated uuid@3.4.0: Please upgrade  to version 7 or higher.  Older versions may use Math.random() in certain circumstances, which is known to be problematic.  See https://v8.dev/blog/math-random for details.
 WARN  deprecated uuid@3.4.0: Please upgrade  to version 7 or higher.  Older versions may use Math.random() in certain circumstances, which is known to be problematic.  See https://v8.dev/blog/math-random for details.

Already up-to-date

 WARN  Issues with peer dependencies found
.
└─┬ react-native
  ├─┬ react-native-codegen
  │ └─┬ jscodeshift
  │   └── ✕ missing peer @babel/preset-env@^7.1.6
  └─┬ use-subscription
    └── ✕ unmet peer react@^18.0.0: found 17.0.1
Peer dependencies that should be installed:
  @babel/preset-env@^7.1.6

Progress: resolved 340, reused 340, downloaded 0, added 0, done
  `;
  /* eslint-enable no-irregular-whitespace */

  it('does not filter normal output', () => {
    const stream = new PassThrough()
      .pipe(split(/\r?\n/, (line: string) => line + '\n'))
      .pipe(new PnpmStdoutTransform())
      .on('data', (data: Buffer) => {
        expect(installNormal).toContain(data.toString());
      });

    for (const line of installNormal.split('\n')) {
      stream.write(line);
    }

    stream.end();

    return new Promise<void>((resolve, reject) => {
      stream.on('error', reject);
      stream.on('end', resolve);
    });
  });

  it('filters peer dependency warnings', () => {
    const stream = new PassThrough()
      .pipe(split(/\r?\n/, (line: string) => line + '\n'))
      .pipe(new PnpmStdoutTransform())
      .on('data', (data: Buffer) => {
        expect(data.toString()).not.toContain('peer dependencies');
      });

    for (const line of installPeerDepsWarning.split('\n')) {
      stream.write(line);
    }

    stream.end();

    return new Promise<void>((resolve, reject) => {
      stream.on('error', reject);
      stream.on('end', resolve);
    });
  });
});
