import spawnAsync from '@expo/spawn-async';
import { vol } from 'memfs';
import path from 'path';

import { mockSpawnPromise, mockedSpawnAsync, STUB_SPAWN_CHILD } from '../../__tests__/spawn-utils';
import { YarnPackageManager } from '../YarnPackageManager';

jest.mock('@expo/spawn-async');
jest.mock('fs');

beforeAll(() => {
  // Disable logging to clean up test ouput
  jest.spyOn(console, 'log').mockImplementation();
});

describe('YarnPackageManager', () => {
  const projectRoot = '/project/with-yarn';

  it('name is set to yarn', () => {
    const yarn = new YarnPackageManager({ cwd: projectRoot });
    expect(yarn.name).toBe('yarn');
  });

  describe('runAsync', () => {
    it('logs executed command', async () => {
      const log = jest.fn();
      const yarn = new YarnPackageManager({ cwd: projectRoot, log });
      await yarn.runAsync(['install', '--some-flag']);
      expect(log).toHaveBeenCalledWith('> yarn install --some-flag');
    });

    it('pipes error output without silent', async () => {
      const stderr = { pipe: jest.fn() };
      const yarn = new YarnPackageManager({ cwd: projectRoot });

      mockedSpawnAsync.mockImplementationOnce(() =>
        mockSpawnPromise(Promise.reject(new Error('test')), { stderr })
      );

      await expect(yarn.runAsync(['install'])).rejects.toThrowError();
      expect(stderr.pipe).toHaveBeenCalledWith(process.stderr);
    });

    it('does not pipe error output with silent', async () => {
      const stderr = { pipe: jest.fn() };
      const yarn = new YarnPackageManager({ cwd: projectRoot, silent: true });

      mockedSpawnAsync.mockImplementationOnce(() =>
        mockSpawnPromise(Promise.reject(new Error('test')), { stderr })
      );

      await expect(yarn.runAsync(['install'])).rejects.toThrowError();
      expect(stderr.pipe).not.toHaveBeenCalledWith();
    });

    it('adds a single package with custom parameters', async () => {
      const yarn = new YarnPackageManager({ cwd: projectRoot });
      await yarn.runAsync(['add', '--peer', '@babel/core']);

      expect(spawnAsync).toBeCalledWith(
        'yarnpkg',
        ['add', '--peer', '@babel/core'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('adds multiple packages with custom parameters', async () => {
      const yarn = new YarnPackageManager({ cwd: projectRoot });
      await yarn.runAsync(['add', '--peer', '@babel/core', '@babel/runtime']);

      expect(spawnAsync).toBeCalledWith(
        'yarnpkg',
        ['add', '--peer', '@babel/core', '@babel/runtime'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });
  });

  describe('versionAsync', () => {
    it('returns version from yarn', async () => {
      mockedSpawnAsync.mockImplementation(() =>
        mockSpawnPromise(Promise.resolve({ stdout: '4.2.0\n' }))
      );

      const yarn = new YarnPackageManager({ cwd: projectRoot });

      expect(await yarn.versionAsync()).toBe('4.2.0');
      expect(spawnAsync).toBeCalledWith('yarnpkg', ['--version'], expect.anything());
    });
  });

  describe('getConfigAsync', () => {
    it('returns a configuration key from yarn', async () => {
      mockedSpawnAsync.mockImplementation(() =>
        mockSpawnPromise(Promise.resolve({ stdout: 'https://custom.registry.org/\n' }))
      );

      const yarn = new YarnPackageManager({ cwd: projectRoot });

      expect(await yarn.getConfigAsync('registry')).toBe('https://custom.registry.org/');
      expect(spawnAsync).toBeCalledWith(
        'yarnpkg',
        ['config', 'get', 'registry'],
        expect.anything()
      );
    });
  });

  describe('installAsync', () => {
    it('runs normal installation', async () => {
      const yarn = new YarnPackageManager({ cwd: projectRoot });
      await yarn.installAsync();

      expect(spawnAsync).toBeCalledWith(
        'yarnpkg',
        ['install'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('runs installation with flags', async () => {
      const yarn = new YarnPackageManager({ cwd: projectRoot });
      await yarn.installAsync(['--ignore-scripts']);

      expect(spawnAsync).toBeCalledWith(
        'yarnpkg',
        ['install', '--ignore-scripts'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });
  });

  describe('uninstallAsync', () => {
    afterEach(() => vol.reset());

    it('removes node_modules folder relative to cwd', async () => {
      vol.fromJSON({
        [path.join(projectRoot, 'package.json')]: '{}',
        [path.join(projectRoot, 'node_modules/expo/package.json')]: '{}',
      });

      const yarn = new YarnPackageManager({ cwd: projectRoot });
      await yarn.uninstallAsync();

      expect(vol.existsSync(path.join(projectRoot, 'node_modules'))).toBe(false);
    });

    it('skips removing non-existing node_modules folder', async () => {
      vol.fromJSON({
        [path.join(projectRoot, 'package.json')]: '{}',
      });

      const yarn = new YarnPackageManager({ cwd: projectRoot });
      await yarn.uninstallAsync();

      expect(vol.existsSync(path.join(projectRoot, 'node_modules'))).toBe(false);
    });

    it('fails when no cwd is provided', async () => {
      const yarn = new YarnPackageManager({ cwd: undefined });
      await expect(yarn.uninstallAsync()).rejects.toThrow('cwd is required');
    });
  });

  describe('addAsync', () => {
    it('installs project without packages', async () => {
      const yarn = new YarnPackageManager({ cwd: projectRoot });
      await yarn.addAsync();

      expect(spawnAsync).toBeCalledWith(
        'yarnpkg',
        ['install'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('returns pending spawn promise with child', async () => {
      const yarn = new YarnPackageManager({ cwd: projectRoot });
      const pending = yarn.addAsync(['expo']);

      expect(pending).toHaveProperty('child', expect.any(Promise));
      await expect(pending.child).resolves.toMatchObject(STUB_SPAWN_CHILD);
    });

    it('adds a single package to dependencies', async () => {
      const yarn = new YarnPackageManager({ cwd: projectRoot });
      await yarn.addAsync(['@react-navigation/native']);

      expect(spawnAsync).toBeCalledWith(
        'yarnpkg',
        ['add', '@react-navigation/native'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('adds multiple packages to dependencies', async () => {
      const yarn = new YarnPackageManager({ cwd: projectRoot });
      await yarn.addAsync(['@react-navigation/native', '@react-navigation/drawer']);

      expect(spawnAsync).toBeCalledWith(
        'yarnpkg',
        ['add', '@react-navigation/native', '@react-navigation/drawer'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });
  });

  describe('addDevAsync', () => {
    it('installs project without packages', async () => {
      const yarn = new YarnPackageManager({ cwd: projectRoot });
      await yarn.addDevAsync();

      expect(spawnAsync).toBeCalledWith(
        'yarnpkg',
        ['install'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('returns pending spawn promise with child', async () => {
      const yarn = new YarnPackageManager({ cwd: projectRoot });
      const pending = yarn.addDevAsync(['expo']);

      expect(pending).toHaveProperty('child', expect.any(Promise));
      await expect(pending.child).resolves.toMatchObject(STUB_SPAWN_CHILD);
    });

    it('adds a single package to dev dependencies', async () => {
      const yarn = new YarnPackageManager({ cwd: projectRoot });
      await yarn.addDevAsync(['eslint']);

      expect(spawnAsync).toBeCalledWith(
        'yarnpkg',
        ['add', '--dev', 'eslint'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('adds multiple packages to dev dependencies', async () => {
      const yarn = new YarnPackageManager({ cwd: projectRoot });
      await yarn.addDevAsync(['eslint', 'prettier']);

      expect(spawnAsync).toBeCalledWith(
        'yarnpkg',
        ['add', '--dev', 'eslint', 'prettier'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });
  });

  describe('addGlobalAsync', () => {
    it('installs project without packages', async () => {
      const yarn = new YarnPackageManager({ cwd: projectRoot });
      await yarn.addGlobalAsync();

      expect(spawnAsync).toBeCalledWith(
        'yarnpkg',
        ['install'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('returns pending spawn promise with child', async () => {
      const yarn = new YarnPackageManager({ cwd: projectRoot });
      const pending = yarn.addGlobalAsync(['expo']);

      expect(pending).toHaveProperty('child', expect.any(Promise));
      await expect(pending.child).resolves.toMatchObject(STUB_SPAWN_CHILD);
    });

    it('adds a single package globally', async () => {
      const yarn = new YarnPackageManager({ cwd: projectRoot });
      await yarn.addGlobalAsync(['expo-cli@^5']);

      expect(spawnAsync).toBeCalledWith(
        'yarnpkg',
        ['global', 'add', 'expo-cli@^5'],
        expect.anything()
      );
    });

    it('adds multiple packages globally', async () => {
      const yarn = new YarnPackageManager({ cwd: projectRoot });
      await yarn.addGlobalAsync(['expo-cli@^5', 'eas-cli']);

      expect(spawnAsync).toBeCalledWith(
        'yarnpkg',
        ['global', 'add', 'expo-cli@^5', 'eas-cli'],
        expect.anything()
      );
    });
  });

  describe('removeAsync', () => {
    it('removes a single package', async () => {
      const yarn = new YarnPackageManager({ cwd: projectRoot });
      await yarn.removeAsync(['metro']);

      expect(spawnAsync).toBeCalledWith(
        'yarnpkg',
        ['remove', 'metro'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('removes multiple packages', async () => {
      const yarn = new YarnPackageManager({ cwd: projectRoot });
      await yarn.removeAsync(['metro', 'jest-haste-map']);

      expect(spawnAsync).toBeCalledWith(
        'yarnpkg',
        ['remove', 'metro', 'jest-haste-map'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });
  });

  describe('removeDevAsync', () => {
    it('removes a single package', async () => {
      const yarn = new YarnPackageManager({ cwd: projectRoot });
      await yarn.removeDevAsync(['metro']);

      expect(spawnAsync).toBeCalledWith(
        'yarnpkg',
        ['remove', 'metro'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('removes multiple packages', async () => {
      const yarn = new YarnPackageManager({ cwd: projectRoot });
      await yarn.removeDevAsync(['metro', 'jest-haste-map']);

      expect(spawnAsync).toBeCalledWith(
        'yarnpkg',
        ['remove', 'metro', 'jest-haste-map'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });
  });

  describe('removeGlobalAsync', () => {
    it('removes a single package', async () => {
      const yarn = new YarnPackageManager({ cwd: projectRoot });
      await yarn.removeGlobalAsync(['expo-cli']);

      expect(spawnAsync).toBeCalledWith(
        'yarnpkg',
        ['global', 'remove', 'expo-cli'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('removes multiple packages', async () => {
      const yarn = new YarnPackageManager({ cwd: projectRoot });
      await yarn.removeGlobalAsync(['expo-cli', 'eas-cli']);

      expect(spawnAsync).toBeCalledWith(
        'yarnpkg',
        ['global', 'remove', 'expo-cli', 'eas-cli'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });
  });

  describe('workspaceRoot', () => {
    const workspaceRoot = '/monorepo';
    const projectRoot = '/monorepo/packages/test';

    it('returns null for non-monorepo project', () => {
      vol.fromJSON(
        {
          'package.json': JSON.stringify({ name: 'project' }),
        },
        projectRoot
      );

      const yarn = new YarnPackageManager({ cwd: projectRoot });
      expect(yarn.workspaceRoot()).toBeNull();
    });

    it('returns new instance for monorepo project', () => {
      vol.fromJSON(
        {
          'packages/test/package.json': JSON.stringify({ name: 'project' }),
          'package.json': JSON.stringify({
            name: 'monorepo',
            workspaces: ['packages/*'],
          }),
        },
        workspaceRoot
      );

      const yarn = new YarnPackageManager({ cwd: projectRoot });
      const root = yarn.workspaceRoot();
      expect(root).toBeInstanceOf(YarnPackageManager);
      expect(root).not.toBe(yarn);
    });
  });

  // describe('offline support', () => {
  //   // TODO
  // });
});
