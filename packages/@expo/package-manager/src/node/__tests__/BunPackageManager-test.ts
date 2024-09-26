import spawnAsync from '@expo/spawn-async';
import { vol } from 'memfs';
import path from 'path';

import { mockSpawnPromise } from '../../__tests__/spawn-utils';
import { BunPackageManager } from '../BunPackageManager';

jest.mock('@expo/spawn-async');
// Jest doesn't mock `node:fs` when mocking `fs`
jest.mock('fs', () => require('memfs').fs);
jest.mock('node:fs', () => require('memfs').fs);

beforeAll(() => {
  // Disable logging to clean up test ouput
  jest.spyOn(console, 'log').mockImplementation();
});

describe('BunPackageManager', () => {
  const projectRoot = '/project/with-bun';

  it('name is set to bun', () => {
    const bun = new BunPackageManager({ cwd: projectRoot });
    expect(bun.name).toBe('bun');
  });

  describe('getDefaultEnvironment', () => {
    it('runs npm with ADBLOCK=1 and DISABLE_OPENCOLLECTIVE=1', async () => {
      const bun = new BunPackageManager({ cwd: projectRoot });
      await bun.installAsync();

      expect(spawnAsync).toBeCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          env: expect.objectContaining({ ADBLOCK: '1', DISABLE_OPENCOLLECTIVE: '1' }),
        })
      );
    });

    it('runs with overwritten default environment', async () => {
      const bun = new BunPackageManager({ cwd: projectRoot, env: { ADBLOCK: '0' } });
      await bun.installAsync();

      expect(spawnAsync).toBeCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          env: { ADBLOCK: '0', DISABLE_OPENCOLLECTIVE: '1' },
        })
      );
    });
  });

  describe('runBinAsync', () => {
    it('executes bun with the expected command and options', async () => {
      const bun = new BunPackageManager({ cwd: projectRoot });
      await bun.runBinAsync(['eslint', '.']);

      expect(spawnAsync).toHaveBeenCalledWith(
        'bun',
        expect.arrayContaining(['eslint', '.']),
        expect.objectContaining({ cwd: projectRoot })
      );
    });
  });

  describe('runAsync', () => {
    it('logs executed command', async () => {
      const log = jest.fn();
      const bun = new BunPackageManager({ cwd: projectRoot, log });
      await bun.runAsync(['install', '--some-flag']);
      expect(log).toHaveBeenCalledWith('> bun install --some-flag');
    });

    it('inherits stdio output without silent', async () => {
      const bun = new BunPackageManager({ cwd: projectRoot });
      await bun.runAsync(['install']);

      expect(spawnAsync).toBeCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ stdio: 'inherit' })
      );
    });

    it('does not inherit stdio with silent', async () => {
      const bun = new BunPackageManager({ cwd: projectRoot, silent: true });
      await bun.runAsync(['install']);

      expect(spawnAsync).toBeCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ stdio: undefined })
      );
    });

    it('adds a single package with custom parameters', async () => {
      const bun = new BunPackageManager({ cwd: projectRoot });
      await bun.runAsync(['add', '--peer', '@babel/core']);

      expect(spawnAsync).toBeCalledWith(
        'bun',
        ['add', '--peer', '@babel/core'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('adds multiple packages with custom parameters', async () => {
      const bun = new BunPackageManager({ cwd: projectRoot });
      await bun.runAsync(['add', '--peer', '@babel/core', '@babel/runtime']);

      expect(spawnAsync).toBeCalledWith(
        'bun',
        ['add', '--peer', '@babel/core', '@babel/runtime'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });
  });

  describe('versionAsync', () => {
    it('returns version from bun', async () => {
      jest
        .mocked(spawnAsync)
        .mockImplementation(() => mockSpawnPromise(Promise.resolve({ stdout: '4.2.0\n' })));

      const bun = new BunPackageManager({ cwd: projectRoot });

      expect(await bun.versionAsync()).toBe('4.2.0');
      expect(spawnAsync).toBeCalledWith('bun', ['--version'], expect.anything());
    });
  });

  describe('getConfigAsync', () => {
    it('returns a configuration key from bun', async () => {
      jest
        .mocked(spawnAsync)
        .mockImplementation(() =>
          mockSpawnPromise(Promise.resolve({ stdout: 'https://custom.registry.org/\n' }))
        );

      const bun = new BunPackageManager({ cwd: projectRoot });

      expect(await bun.getConfigAsync('registry')).toBe('https://custom.registry.org/');
      expect(spawnAsync).toBeCalledWith('bun', ['config', 'get', 'registry'], expect.anything());
    });
  });

  describe('installAsync', () => {
    it('runs normal installation', async () => {
      const bun = new BunPackageManager({ cwd: projectRoot });
      await bun.installAsync();

      expect(spawnAsync).toBeCalledWith(
        'bun',
        ['install'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('runs installation with flags', async () => {
      const bun = new BunPackageManager({ cwd: projectRoot });
      await bun.installAsync(['--ignore-scripts']);

      expect(spawnAsync).toBeCalledWith(
        'bun',
        ['install', '--ignore-scripts'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });
  });

  describe('uninstallAsync', () => {
    afterEach(() => vol.reset());

    it('removes node_modules folder relative to cwd', async () => {
      vol.fromJSON(
        {
          'package.json': '{}',
          'node_modules/expo/package.json': '{}',
        },
        projectRoot
      );

      const bun = new BunPackageManager({ cwd: projectRoot });
      await bun.uninstallAsync();

      expect(vol.existsSync(path.join(projectRoot, 'node_modules'))).toBe(false);
    });

    it('skips removing non-existing node_modules folder', async () => {
      vol.fromJSON({ 'package.json': '{}' }, projectRoot);

      const bun = new BunPackageManager({ cwd: projectRoot });
      await bun.uninstallAsync();

      expect(vol.existsSync(path.join(projectRoot, 'node_modules'))).toBe(false);
    });

    it('fails when no cwd is provided', async () => {
      const bun = new BunPackageManager({ cwd: undefined });
      await expect(bun.uninstallAsync()).rejects.toThrow('cwd is required');
    });
  });

  describe('addAsync', () => {
    it('installs project without packages', async () => {
      const bun = new BunPackageManager({ cwd: projectRoot });
      await bun.addAsync();

      expect(spawnAsync).toBeCalledWith(
        'bun',
        ['install'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('adds a single package to dependencies', async () => {
      const bun = new BunPackageManager({ cwd: projectRoot });
      await bun.addAsync(['@react-navigation/native']);

      expect(spawnAsync).toBeCalledWith(
        'bun',
        ['add', '@react-navigation/native'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('adds multiple packages to dependencies', async () => {
      const bun = new BunPackageManager({ cwd: projectRoot });
      await bun.addAsync(['@react-navigation/native', '@react-navigation/drawer']);

      expect(spawnAsync).toBeCalledWith(
        'bun',
        ['add', '@react-navigation/native', '@react-navigation/drawer'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });
  });

  describe('addDevAsync', () => {
    it('installs project without packages', async () => {
      const bun = new BunPackageManager({ cwd: projectRoot });
      await bun.addDevAsync();

      expect(spawnAsync).toBeCalledWith(
        'bun',
        ['install'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('adds a single package to dev dependencies', async () => {
      const bun = new BunPackageManager({ cwd: projectRoot });
      await bun.addDevAsync(['eslint']);

      expect(spawnAsync).toBeCalledWith(
        'bun',
        ['add', '--dev', 'eslint'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('adds multiple packages to dev dependencies', async () => {
      const bun = new BunPackageManager({ cwd: projectRoot });
      await bun.addDevAsync(['eslint', 'prettier']);

      expect(spawnAsync).toBeCalledWith(
        'bun',
        ['add', '--dev', 'eslint', 'prettier'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });
  });

  describe('addGlobalAsync', () => {
    it('installs project without packages', async () => {
      const bun = new BunPackageManager({ cwd: projectRoot });
      await bun.addGlobalAsync();

      expect(spawnAsync).toBeCalledWith(
        'bun',
        ['install'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('adds a single package globally', async () => {
      const bun = new BunPackageManager({ cwd: projectRoot });
      await bun.addGlobalAsync(['expo-cli@^5']);

      expect(spawnAsync).toBeCalledWith(
        'bun',
        ['add', '--global', 'expo-cli@^5'],
        expect.anything()
      );
    });

    it('adds multiple packages globally', async () => {
      const bun = new BunPackageManager({ cwd: projectRoot });
      await bun.addGlobalAsync(['expo-cli@^5', 'eas-cli']);

      expect(spawnAsync).toBeCalledWith(
        'bun',
        ['add', '--global', 'expo-cli@^5', 'eas-cli'],
        expect.anything()
      );
    });
  });

  describe('removeAsync', () => {
    it('removes a single package', async () => {
      const bun = new BunPackageManager({ cwd: projectRoot });
      await bun.removeAsync(['metro']);

      expect(spawnAsync).toBeCalledWith(
        'bun',
        ['remove', 'metro'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('removes multiple packages', async () => {
      const bun = new BunPackageManager({ cwd: projectRoot });
      await bun.removeAsync(['metro', 'jest-haste-map']);

      expect(spawnAsync).toBeCalledWith(
        'bun',
        ['remove', 'metro', 'jest-haste-map'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });
  });

  describe('removeDevAsync', () => {
    it('removes a single package', async () => {
      const bun = new BunPackageManager({ cwd: projectRoot });
      await bun.removeDevAsync(['metro']);

      expect(spawnAsync).toBeCalledWith(
        'bun',
        ['remove', 'metro'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('removes multiple packages', async () => {
      const bun = new BunPackageManager({ cwd: projectRoot });
      await bun.removeDevAsync(['metro', 'jest-haste-map']);

      expect(spawnAsync).toBeCalledWith(
        'bun',
        ['remove', 'metro', 'jest-haste-map'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });
  });

  describe('removeGlobalAsync', () => {
    it('removes a single package', async () => {
      const bun = new BunPackageManager({ cwd: projectRoot });
      await bun.removeGlobalAsync(['expo-cli']);

      expect(spawnAsync).toBeCalledWith(
        'bun',
        ['remove', '--global', 'expo-cli'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('removes multiple packages', async () => {
      const bun = new BunPackageManager({ cwd: projectRoot });
      await bun.removeGlobalAsync(['expo-cli', 'eas-cli']);

      expect(spawnAsync).toBeCalledWith(
        'bun',
        ['remove', '--global', 'expo-cli', 'eas-cli'],
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

      const bun = new BunPackageManager({ cwd: projectRoot });
      expect(bun.workspaceRoot()).toBeNull();
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

      const bun = new BunPackageManager({ cwd: projectRoot });
      const root = bun.workspaceRoot();
      expect(root).toBeInstanceOf(BunPackageManager);
      expect(root).not.toBe(bun);
    });
  });

  // describe('offline support', () => {
  //   // TODO
  // });
});
