import spawnAsync from '@expo/spawn-async';
import { vol } from 'memfs';
import path from 'path';

import { mockSpawnPromise, mockedSpawnAsync, STUB_SPAWN_CHILD } from '../../__tests__/spawn-utils';
import { NpmPackageManager } from '../NpmPackageManager';

jest.mock('@expo/spawn-async');
jest.mock('fs');

beforeAll(() => {
  // Disable logging to clean up test ouput
  jest.spyOn(console, 'log').mockImplementation();
});

describe('NpmPackageManager', () => {
  const projectRoot = '/project/with-npm';

  it('name is set to npm', () => {
    const npm = new NpmPackageManager({ cwd: projectRoot });
    expect(npm.name).toBe('npm');
  });

  describe('runAsync', () => {
    it('logs executed command', async () => {
      const log = jest.fn();
      const npm = new NpmPackageManager({ cwd: projectRoot, log });
      await npm.runAsync(['install', '--some-flag']);
      expect(log).toHaveBeenCalledWith('> npm install --some-flag');
    });

    it('pipes error output without silent', async () => {
      const stderr = { pipe: jest.fn() };
      const npm = new NpmPackageManager({ cwd: projectRoot });

      mockedSpawnAsync.mockImplementationOnce(() =>
        mockSpawnPromise(Promise.reject(new Error('test')), { stderr })
      );

      await expect(npm.runAsync(['install'])).rejects.toThrowError();
      expect(stderr.pipe).toHaveBeenCalledWith(process.stderr);
    });

    it('does not pipe error output with silent', async () => {
      const stderr = { pipe: jest.fn() };
      const npm = new NpmPackageManager({ cwd: projectRoot, silent: true });

      mockedSpawnAsync.mockImplementationOnce(() =>
        mockSpawnPromise(Promise.reject(new Error('test')), { stderr })
      );

      await expect(npm.runAsync(['install'])).rejects.toThrowError();
      expect(stderr.pipe).not.toHaveBeenCalledWith();
    });

    it('returns spawn promise with child', () => {
      const npm = new NpmPackageManager({ cwd: projectRoot });
      expect(npm.runAsync(['install'])).toHaveProperty(
        'child',
        expect.objectContaining(STUB_SPAWN_CHILD)
      );
    });

    it('adds a single package with custom parameters', async () => {
      const npm = new NpmPackageManager({ cwd: projectRoot });
      await npm.runAsync(['install', '--save-peer', '@babel/core']);

      expect(spawnAsync).toBeCalledWith(
        'npm',
        ['install', '--save-peer', '@babel/core'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('adds multiple packages with custom parameters', async () => {
      const npm = new NpmPackageManager({ cwd: projectRoot });
      await npm.runAsync(['install', '--save-peer', '@babel/core', '@babel/runtime']);

      expect(spawnAsync).toBeCalledWith(
        'npm',
        ['install', '--save-peer', '@babel/core', '@babel/runtime'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });
  });

  describe('versionAsync', () => {
    it('returns version from npm', async () => {
      mockedSpawnAsync.mockImplementation(() =>
        mockSpawnPromise(Promise.resolve({ stdout: '7.0.0\n' }))
      );

      const npm = new NpmPackageManager({ cwd: projectRoot });

      expect(await npm.versionAsync()).toBe('7.0.0');
      expect(spawnAsync).toBeCalledWith('npm', ['--version'], expect.anything());
    });
  });

  describe('getConfigAsync', () => {
    it('returns a configuration key from npm', async () => {
      mockedSpawnAsync.mockImplementation(() =>
        mockSpawnPromise(Promise.resolve({ stdout: 'https://custom.registry.org/\n' }))
      );

      const npm = new NpmPackageManager({ cwd: projectRoot });

      expect(await npm.getConfigAsync('registry')).toBe('https://custom.registry.org/');
      expect(spawnAsync).toBeCalledWith('npm', ['config', 'get', 'registry'], expect.anything());
    });
  });

  describe('installAsync', () => {
    it('runs normal installation', async () => {
      const npm = new NpmPackageManager({ cwd: projectRoot });
      await npm.installAsync();

      expect(spawnAsync).toBeCalledWith(
        'npm',
        ['install'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('runs installation with flags', async () => {
      const npm = new NpmPackageManager({ cwd: projectRoot });
      await npm.installAsync(['--ignore-scripts']);

      expect(spawnAsync).toBeCalledWith(
        'npm',
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

      const npm = new NpmPackageManager({ cwd: projectRoot });
      await npm.uninstallAsync();

      expect(vol.existsSync(path.join(projectRoot, 'node_modules'))).toBe(false);
    });

    it('skips removing non-existing node_modules folder', async () => {
      vol.fromJSON({
        [path.join(projectRoot, 'package.json')]: '{}',
      });

      const npm = new NpmPackageManager({ cwd: projectRoot });
      await npm.uninstallAsync();

      expect(vol.existsSync(path.join(projectRoot, 'node_modules'))).toBe(false);
    });

    it('fails when no cwd is provided', async () => {
      const npm = new NpmPackageManager({ cwd: undefined });
      await expect(npm.uninstallAsync()).rejects.toThrow('cwd is required');
    });
  });

  describe('addAsync', () => {
    it('installs project without packages', async () => {
      const npm = new NpmPackageManager({ cwd: projectRoot });
      await npm.addAsync();

      expect(spawnAsync).toBeCalledWith(
        'npm',
        ['install'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('returns pending spawn promise with child', async () => {
      const npm = new NpmPackageManager({ cwd: projectRoot });
      const pending = npm.addAsync(['expo']);

      expect(pending).toHaveProperty('child', expect.any(Promise));
      await expect(pending.child).resolves.toMatchObject(STUB_SPAWN_CHILD);
    });

    it('adds a single unversioned package to dependencies', async () => {
      const npm = new NpmPackageManager({ cwd: projectRoot });
      await npm.addAsync(['expo']);

      expect(spawnAsync).toBeCalledWith(
        'npm',
        ['install', '--save', 'expo'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('adds a multiple unversioned package to dependencies', async () => {
      const npm = new NpmPackageManager({ cwd: projectRoot });
      await npm.addAsync(['expo', 'react-native']);

      expect(spawnAsync).toBeCalledWith(
        'npm',
        ['install', '--save', 'expo', 'react-native'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('installs multiple versioned dependencies by updating package.json', async () => {
      vol.fromJSON({
        [path.join(projectRoot, 'package.json')]: '{}',
      });

      const npm = new NpmPackageManager({ cwd: projectRoot });
      await npm.addAsync(['expo@^46', 'react-native@0.69.3']);

      const packageFile = JSON.parse(
        vol.readFileSync(path.join(projectRoot, 'package.json')).toString()
      );

      expect(packageFile).toHaveProperty(
        'dependencies',
        expect.objectContaining({ expo: '^46', 'react-native': '0.69.3' })
      );
      expect(spawnAsync).toBeCalledWith(
        'npm',
        ['install'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('installs mixed dependencies with flags by updating package.json', async () => {
      vol.fromJSON({
        [path.join(projectRoot, 'package.json')]: '{}',
      });

      const npm = new NpmPackageManager({ cwd: projectRoot });
      await npm.addAsync(['expo@^46', 'react-native@0.69.3', 'jest', '--ignore-scripts']);

      const packageFile = JSON.parse(
        vol.readFileSync(path.join(projectRoot, 'package.json')).toString()
      );

      expect(packageFile).toHaveProperty(
        'dependencies',
        expect.objectContaining({ expo: '^46', 'react-native': '0.69.3' })
      );
      expect(spawnAsync).toBeCalledWith(
        'npm',
        ['install', '--save', '--ignore-scripts', 'jest'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });
  });

  describe('addDevAsync', () => {
    it('installs project without packages', async () => {
      const npm = new NpmPackageManager({ cwd: projectRoot });
      await npm.addDevAsync();

      expect(spawnAsync).toBeCalledWith(
        'npm',
        ['install'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('returns pending spawn promise with child', async () => {
      const npm = new NpmPackageManager({ cwd: projectRoot });
      const pending = npm.addDevAsync(['expo']);

      expect(pending).toHaveProperty('child', expect.any(Promise));
      await expect(pending.child).resolves.toMatchObject(STUB_SPAWN_CHILD);
    });

    it('adds a single unversioned package to dependencies', async () => {
      const npm = new NpmPackageManager({ cwd: projectRoot });
      await npm.addDevAsync(['expo']);

      expect(spawnAsync).toBeCalledWith(
        'npm',
        ['install', '--save-dev', 'expo'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('adds a multiple unversioned package to dependencies', async () => {
      const npm = new NpmPackageManager({ cwd: projectRoot });
      await npm.addDevAsync(['expo', 'react-native']);

      expect(spawnAsync).toBeCalledWith(
        'npm',
        ['install', '--save-dev', 'expo', 'react-native'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('installs multiple versioned dependencies by updating package.json', async () => {
      vol.fromJSON({
        [path.join(projectRoot, 'package.json')]: '{}',
      });

      const npm = new NpmPackageManager({ cwd: projectRoot });
      await npm.addDevAsync(['expo@^46', 'react-native@0.69.3']);

      const packageFile = JSON.parse(
        vol.readFileSync(path.join(projectRoot, 'package.json')).toString()
      );

      expect(packageFile).toHaveProperty(
        'devDependencies',
        expect.objectContaining({ expo: '^46', 'react-native': '0.69.3' })
      );
      expect(spawnAsync).toBeCalledWith(
        'npm',
        ['install'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('installs mixed dependencies with flags by updating package.json', async () => {
      vol.fromJSON({
        [path.join(projectRoot, 'package.json')]: '{}',
      });

      const npm = new NpmPackageManager({ cwd: projectRoot });
      await npm.addDevAsync(['expo@^46', 'react-native@0.69.3', 'jest', '--ignore-scripts']);

      const packageFile = JSON.parse(
        vol.readFileSync(path.join(projectRoot, 'package.json')).toString()
      );

      expect(packageFile).toHaveProperty(
        'devDependencies',
        expect.objectContaining({ expo: '^46', 'react-native': '0.69.3' })
      );
      expect(spawnAsync).toBeCalledWith(
        'npm',
        ['install', '--save-dev', '--ignore-scripts', 'jest'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });
  });

  describe('addGlobalAsync', () => {
    it('installs project without packages', async () => {
      const npm = new NpmPackageManager({ cwd: projectRoot });
      await npm.addGlobalAsync();

      expect(spawnAsync).toBeCalledWith(
        'npm',
        ['install'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('adds a single package globally', async () => {
      const npm = new NpmPackageManager({ cwd: projectRoot });
      await npm.addGlobalAsync(['expo-cli@^5']);

      expect(spawnAsync).toBeCalledWith(
        'npm',
        ['install', '--global', 'expo-cli@^5'],
        expect.anything()
      );
    });

    it('adds multiple packages globally', async () => {
      const npm = new NpmPackageManager({ cwd: projectRoot });
      await npm.addGlobalAsync(['expo-cli@^5', 'eas-cli']);

      expect(spawnAsync).toBeCalledWith(
        'npm',
        ['install', '--global', 'expo-cli@^5', 'eas-cli'],
        expect.anything()
      );
    });
  });

  describe('removeAsync', () => {
    it('removes a single package', async () => {
      const npm = new NpmPackageManager({ cwd: projectRoot });
      await npm.removeAsync(['metro']);

      expect(spawnAsync).toBeCalledWith(
        'npm',
        ['uninstall', 'metro'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('removes multiple packages', async () => {
      const npm = new NpmPackageManager({ cwd: projectRoot });
      await npm.removeAsync(['metro', 'jest-haste-map']);

      expect(spawnAsync).toBeCalledWith(
        'npm',
        ['uninstall', 'metro', 'jest-haste-map'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });
  });

  describe('removeDevAsync', () => {
    it('removes a single package', async () => {
      const npm = new NpmPackageManager({ cwd: projectRoot });
      await npm.removeDevAsync(['metro']);

      expect(spawnAsync).toBeCalledWith(
        'npm',
        ['uninstall', '--save-dev', 'metro'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('removes multiple packages', async () => {
      const npm = new NpmPackageManager({ cwd: projectRoot });
      await npm.removeDevAsync(['metro', 'jest-haste-map']);

      expect(spawnAsync).toBeCalledWith(
        'npm',
        ['uninstall', '--save-dev', 'metro', 'jest-haste-map'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });
  });

  describe('removeGlobalAsync', () => {
    it('removes a single package', async () => {
      const npm = new NpmPackageManager({ cwd: projectRoot });
      await npm.removeGlobalAsync(['expo-cli']);

      expect(spawnAsync).toBeCalledWith(
        'npm',
        ['uninstall', '--global', 'expo-cli'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('removes multiple packages', async () => {
      const npm = new NpmPackageManager({ cwd: projectRoot });
      await npm.removeGlobalAsync(['expo-cli', 'eas-cli']);

      expect(spawnAsync).toBeCalledWith(
        'npm',
        ['uninstall', '--global', 'expo-cli', 'eas-cli'],
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

      const npm = new NpmPackageManager({ cwd: projectRoot });
      expect(npm.workspaceRoot()).toBeNull();
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

      const npm = new NpmPackageManager({ cwd: projectRoot });
      const root = npm.workspaceRoot();
      expect(root).toBeInstanceOf(NpmPackageManager);
      expect(root).not.toBe(npm);
    });
  });
});
