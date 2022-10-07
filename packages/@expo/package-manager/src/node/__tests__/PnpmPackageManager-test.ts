import spawnAsync from '@expo/spawn-async';
import { vol } from 'memfs';
import path from 'path';

import { asMock } from '../../__tests__/asMock';
import { mockSpawnPromise, mockedSpawnAsync } from '../../__tests__/spawn-utils';
import { isCI } from '../../utils/env';
import { PNPM_WORKSPACE_FILE } from '../../utils/nodeWorkspaces';
import { PnpmPackageManager } from '../PnpmPackageManager';

jest.mock('@expo/spawn-async');
jest.mock('fs');
jest.mock('../../utils/env', () => ({ isCI: jest.fn(() => false) }));

beforeAll(() => {
  // Disable logging to clean up test ouput
  jest.spyOn(console, 'log').mockImplementation();
});

describe('PnpmPackageManager', () => {
  const projectRoot = '/project/with-pnpm';

  it('name is set to pnpm', () => {
    const pnpm = new PnpmPackageManager({ cwd: projectRoot });
    expect(pnpm.name).toBe('pnpm');
  });

  describe('runAsync', () => {
    it('logs executed command', async () => {
      const log = jest.fn();
      const pnpm = new PnpmPackageManager({ cwd: projectRoot, log });
      await pnpm.runAsync(['install', '--some-flag']);
      expect(log).toHaveBeenCalledWith('> pnpm install --some-flag');
    });

    it('pipes error output without silent', async () => {
      const stderr = { pipe: jest.fn() };
      const pnpm = new PnpmPackageManager({ cwd: projectRoot });

      mockedSpawnAsync.mockImplementationOnce(() =>
        mockSpawnPromise(Promise.reject(new Error('test')), { stderr })
      );

      await expect(pnpm.runAsync(['install'])).rejects.toThrowError();
      expect(stderr.pipe).toHaveBeenCalledWith(process.stderr);
    });

    it('does not pipe error output with silent', async () => {
      const stderr = { pipe: jest.fn() };
      const pnpm = new PnpmPackageManager({ cwd: projectRoot, silent: true });

      mockedSpawnAsync.mockImplementationOnce(() =>
        mockSpawnPromise(Promise.reject(new Error('test')), { stderr })
      );

      await expect(pnpm.runAsync(['install'])).rejects.toThrowError();
      expect(stderr.pipe).not.toHaveBeenCalledWith();
    });

    it('adds a single package with custom parameters', async () => {
      const pnpm = new PnpmPackageManager({ cwd: projectRoot });
      await pnpm.runAsync(['add', '--save-peer', '@babel/core']);

      expect(spawnAsync).toBeCalledWith(
        'pnpm',
        ['add', '--save-peer', '@babel/core'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('adds multiple packages with custom parameters', async () => {
      const pnpm = new PnpmPackageManager({ cwd: projectRoot });
      await pnpm.runAsync(['add', '--save-peer', '@babel/core', '@babel/runtime']);

      expect(spawnAsync).toBeCalledWith(
        'pnpm',
        ['add', '--save-peer', '@babel/core', '@babel/runtime'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });
  });

  describe('versionAsync', () => {
    it('returns version from pnpm', async () => {
      mockedSpawnAsync.mockImplementation(() =>
        mockSpawnPromise(Promise.resolve({ stdout: '7.0.0\n' }))
      );

      const pnpm = new PnpmPackageManager({ cwd: projectRoot });

      expect(await pnpm.versionAsync()).toBe('7.0.0');
      expect(spawnAsync).toBeCalledWith('pnpm', ['--version'], expect.anything());
    });
  });

  describe('getConfigAsync', () => {
    it('returns a configuration key from pnpm', async () => {
      mockedSpawnAsync.mockImplementation(() =>
        mockSpawnPromise(Promise.resolve({ stdout: 'https://custom.registry.org/\n' }))
      );

      const pnpm = new PnpmPackageManager({ cwd: projectRoot });

      expect(await pnpm.getConfigAsync('registry')).toBe('https://custom.registry.org/');
      expect(spawnAsync).toBeCalledWith('pnpm', ['config', 'get', 'registry'], expect.anything());
    });
  });

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

    it('runs installation with flags', async () => {
      const pnpm = new PnpmPackageManager({ cwd: projectRoot });
      await pnpm.installAsync(['--ignore-scripts']);

      expect(spawnAsync).toBeCalledWith(
        'pnpm',
        ['install', '--ignore-scripts'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    describe('frozen lockfile', () => {
      it('does not add --no-frozen-lockfile when not in CI', async () => {
        asMock(isCI).mockReturnValueOnce(false);

        const pnpm = new PnpmPackageManager({ cwd: projectRoot });
        await pnpm.installAsync();

        expect(spawnAsync).toBeCalledWith(
          'pnpm',
          ['install'],
          expect.objectContaining({ cwd: projectRoot })
        );
      });

      it('adds --no-frozen-lockfile when in CI', async () => {
        asMock(isCI).mockReturnValueOnce(true);

        const pnpm = new PnpmPackageManager({ cwd: projectRoot });
        await pnpm.installAsync();

        expect(spawnAsync).toBeCalledWith(
          'pnpm',
          ['install', '--no-frozen-lockfile'],
          expect.objectContaining({ cwd: projectRoot })
        );
      });

      it('does not add --no-frozen-lockfile if passed as flag in CI', async () => {
        asMock(isCI).mockReturnValueOnce(true);

        const pnpm = new PnpmPackageManager({ cwd: projectRoot });
        await pnpm.installAsync(['--frozen-lockfile']);

        expect(spawnAsync).toBeCalledWith(
          'pnpm',
          ['install', '--frozen-lockfile'],
          expect.objectContaining({ cwd: projectRoot })
        );
      });
    });
  });

  describe('uninstallAsync', () => {
    afterEach(() => vol.reset());

    it('removes node_modules folder relative to cwd', async () => {
      vol.fromJSON({
        [path.join(projectRoot, 'package.json')]: '{}',
        [path.join(projectRoot, 'node_modules/expo/package.json')]: '{}',
      });

      const pnpm = new PnpmPackageManager({ cwd: projectRoot });
      await pnpm.uninstallAsync();

      expect(vol.existsSync(path.join(projectRoot, 'node_modules'))).toBe(false);
    });

    it('skips removing non-existing node_modules folder', async () => {
      vol.fromJSON({
        [path.join(projectRoot, 'package.json')]: '{}',
      });

      const pnpm = new PnpmPackageManager({ cwd: projectRoot });
      await pnpm.uninstallAsync();

      expect(vol.existsSync(path.join(projectRoot, 'node_modules'))).toBe(false);
    });

    it('fails when no cwd is provided', async () => {
      const pnpm = new PnpmPackageManager({ cwd: undefined });
      await expect(pnpm.uninstallAsync()).rejects.toThrow('cwd is required');
    });
  });

  describe('addAsync', () => {
    it('installs project without packages', async () => {
      const pnpm = new PnpmPackageManager({ cwd: projectRoot });
      await pnpm.addAsync();

      expect(spawnAsync).toBeCalledWith(
        'pnpm',
        ['install'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('adds a single package to dependencies', async () => {
      const pnpm = new PnpmPackageManager({ cwd: projectRoot });
      await pnpm.addAsync(['@react-navigation/native']);

      expect(spawnAsync).toBeCalledWith(
        'pnpm',
        ['add', '@react-navigation/native'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('adds multiple packages to dependencies', async () => {
      const pnpm = new PnpmPackageManager({ cwd: projectRoot });
      await pnpm.addAsync(['@react-navigation/native', '@react-navigation/drawer']);

      expect(spawnAsync).toBeCalledWith(
        'pnpm',
        ['add', '@react-navigation/native', '@react-navigation/drawer'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });
  });

  describe('addDevAsync', () => {
    it('installs project without packages', async () => {
      const pnpm = new PnpmPackageManager({ cwd: projectRoot });
      await pnpm.addDevAsync();

      expect(spawnAsync).toBeCalledWith(
        'pnpm',
        ['install'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('adds a single package to dev dependencies', async () => {
      const pnpm = new PnpmPackageManager({ cwd: projectRoot });
      await pnpm.addDevAsync(['eslint']);

      expect(spawnAsync).toBeCalledWith(
        'pnpm',
        ['add', '--save-dev', 'eslint'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('adds multiple packages to dev dependencies', async () => {
      const pnpm = new PnpmPackageManager({ cwd: projectRoot });
      await pnpm.addDevAsync(['eslint', 'prettier']);

      expect(spawnAsync).toBeCalledWith(
        'pnpm',
        ['add', '--save-dev', 'eslint', 'prettier'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });
  });

  describe('addGlobalAsync', () => {
    it('installs project without packages', async () => {
      const pnpm = new PnpmPackageManager({ cwd: projectRoot });
      await pnpm.addGlobalAsync();

      expect(spawnAsync).toBeCalledWith(
        'pnpm',
        ['install'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('adds a single package globally', async () => {
      const pnpm = new PnpmPackageManager({ cwd: projectRoot });
      await pnpm.addGlobalAsync(['expo-cli@^5']);

      expect(spawnAsync).toBeCalledWith(
        'pnpm',
        ['add', '--global', 'expo-cli@^5'],
        expect.anything()
      );
    });

    it('adds multiple packages globally', async () => {
      const pnpm = new PnpmPackageManager({ cwd: projectRoot });
      await pnpm.addGlobalAsync(['expo-cli@^5', 'eas-cli']);

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
      await pnpm.removeAsync(['metro']);

      expect(spawnAsync).toBeCalledWith(
        'pnpm',
        ['remove', 'metro'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('removes multiple packages', async () => {
      const pnpm = new PnpmPackageManager({ cwd: projectRoot });
      await pnpm.removeAsync(['metro', 'jest-haste-map']);

      expect(spawnAsync).toBeCalledWith(
        'pnpm',
        ['remove', 'metro', 'jest-haste-map'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });
  });

  describe('removeDevAsync', () => {
    it('removes a single package', async () => {
      const pnpm = new PnpmPackageManager({ cwd: projectRoot });
      await pnpm.removeDevAsync(['metro']);

      expect(spawnAsync).toBeCalledWith(
        'pnpm',
        ['remove', '--save-dev', 'metro'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('removes multiple packages', async () => {
      const pnpm = new PnpmPackageManager({ cwd: projectRoot });
      await pnpm.removeDevAsync(['metro', 'jest-haste-map']);

      expect(spawnAsync).toBeCalledWith(
        'pnpm',
        ['remove', '--save-dev', 'metro', 'jest-haste-map'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });
  });

  describe('removeGlobalAsync', () => {
    it('removes a single package', async () => {
      const pnpm = new PnpmPackageManager({ cwd: projectRoot });
      await pnpm.removeGlobalAsync(['expo-cli']);

      expect(spawnAsync).toBeCalledWith(
        'pnpm',
        ['remove', '--global', 'expo-cli'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('removes multiple packages', async () => {
      const pnpm = new PnpmPackageManager({ cwd: projectRoot });
      await pnpm.removeGlobalAsync(['expo-cli', 'eas-cli']);

      expect(spawnAsync).toBeCalledWith(
        'pnpm',
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

      const pnpm = new PnpmPackageManager({ cwd: projectRoot });
      expect(pnpm.workspaceRoot()).toBeNull();
    });

    it('returns new instance for monorepo project', () => {
      vol.fromJSON(
        {
          'packages/test/package.json': JSON.stringify({ name: 'project' }),
          'package.json': JSON.stringify({
            name: 'monorepo',
          }),
          [PNPM_WORKSPACE_FILE]: 'packages:\n  - packages/*',
        },
        workspaceRoot
      );

      const pnpm = new PnpmPackageManager({ cwd: projectRoot });
      const root = pnpm.workspaceRoot();
      expect(root).toBeInstanceOf(PnpmPackageManager);
      expect(root).not.toBe(pnpm);
    });
  });
});
