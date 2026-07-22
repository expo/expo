import spawnAsync from '@expo/spawn-async';
import { vol } from 'memfs';
import path from 'path';

import { mockSpawnPromise } from '../../__tests__/spawn-utils';
import { NubPackageManager } from '../NubPackageManager';

jest.mock('@expo/spawn-async');
// Jest doesn't mock `node:fs` when mocking `fs`
jest.mock('fs', () => require('memfs').fs);
jest.mock('node:fs', () => require('memfs').fs);

beforeAll(() => {
  // Disable logging to clean up test output
  jest.spyOn(console, 'log').mockImplementation();
});

describe('NubPackageManager', () => {
  const projectRoot = '/project/with-nub';

  it('name is set to nub', () => {
    const nub = new NubPackageManager({ cwd: projectRoot });
    expect(nub.name).toBe('nub');
  });

  describe('getDefaultEnvironment', () => {
    it('runs with ADBLOCK=1 and DISABLE_OPENCOLLECTIVE=1', async () => {
      const nub = new NubPackageManager({ cwd: projectRoot });
      await nub.installAsync();

      expect(spawnAsync).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          env: expect.objectContaining({ ADBLOCK: '1', DISABLE_OPENCOLLECTIVE: '1' }),
        })
      );
    });

    it('runs with overwritten default environment', async () => {
      const nub = new NubPackageManager({ cwd: projectRoot, env: { ADBLOCK: '0' } });
      await nub.installAsync();

      expect(spawnAsync).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          env: { ADBLOCK: '0', DISABLE_OPENCOLLECTIVE: '1' },
        })
      );
    });
  });

  describe('runAsync', () => {
    it('logs executed command', async () => {
      const log = jest.fn();
      const nub = new NubPackageManager({ cwd: projectRoot, log });
      await nub.runAsync(['install', '--some-flag']);
      expect(log).toHaveBeenCalledWith('> nub install --some-flag');
    });
  });

  describe('versionAsync', () => {
    it('returns version from nub', async () => {
      jest
        .mocked(spawnAsync)
        .mockImplementation(() => mockSpawnPromise(Promise.resolve({ stdout: '0.4.13\n' })));

      const nub = new NubPackageManager({ cwd: projectRoot });

      expect(await nub.versionAsync()).toBe('0.4.13');
      expect(spawnAsync).toHaveBeenCalledWith('nub', ['--version'], expect.anything());
    });
  });

  describe('installAsync', () => {
    it('runs normal installation', async () => {
      const nub = new NubPackageManager({ cwd: projectRoot });
      await nub.installAsync();

      expect(spawnAsync).toHaveBeenCalledWith(
        'nub',
        ['install'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('runs installation with flags', async () => {
      const nub = new NubPackageManager({ cwd: projectRoot });
      await nub.installAsync(['--ignore-scripts']);

      expect(spawnAsync).toHaveBeenCalledWith(
        'nub',
        ['install', '--ignore-scripts'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });
  });

  describe('addAsync', () => {
    it('installs project without packages', async () => {
      const nub = new NubPackageManager({ cwd: projectRoot });
      await nub.addAsync();

      expect(spawnAsync).toHaveBeenCalledWith(
        'nub',
        ['install'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('adds a single package to dependencies', async () => {
      const nub = new NubPackageManager({ cwd: projectRoot });
      await nub.addAsync(['@react-navigation/native']);

      expect(spawnAsync).toHaveBeenCalledWith(
        'nub',
        ['add', '@react-navigation/native'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('adds multiple packages to dependencies', async () => {
      const nub = new NubPackageManager({ cwd: projectRoot });
      await nub.addAsync(['@react-navigation/native', '@react-navigation/drawer']);

      expect(spawnAsync).toHaveBeenCalledWith(
        'nub',
        ['add', '@react-navigation/native', '@react-navigation/drawer'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });
  });

  describe('addDevAsync', () => {
    it('adds a single package to dev dependencies', async () => {
      const nub = new NubPackageManager({ cwd: projectRoot });
      await nub.addDevAsync(['eslint']);

      expect(spawnAsync).toHaveBeenCalledWith(
        'nub',
        ['add', '--save-dev', 'eslint'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });
  });

  describe('addGlobalAsync', () => {
    it('adds a single package globally', async () => {
      const nub = new NubPackageManager({ cwd: projectRoot });
      await nub.addGlobalAsync(['expo-cli@^5']);

      expect(spawnAsync).toHaveBeenCalledWith(
        'nub',
        ['add', '--global', 'expo-cli@^5'],
        expect.anything()
      );
    });
  });

  describe('removeAsync', () => {
    it('removes multiple packages', async () => {
      const nub = new NubPackageManager({ cwd: projectRoot });
      await nub.removeAsync(['metro', 'jest-haste-map']);

      expect(spawnAsync).toHaveBeenCalledWith(
        'nub',
        ['remove', 'metro', 'jest-haste-map'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });
  });

  describe('removeDevAsync', () => {
    it('removes a single dev package', async () => {
      const nub = new NubPackageManager({ cwd: projectRoot });
      await nub.removeDevAsync(['eslint']);

      expect(spawnAsync).toHaveBeenCalledWith(
        'nub',
        ['remove', '--save-dev', 'eslint'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });
  });

  describe('removeGlobalAsync', () => {
    it('removes a single global package', async () => {
      const nub = new NubPackageManager({ cwd: projectRoot });
      await nub.removeGlobalAsync(['expo-cli']);

      expect(spawnAsync).toHaveBeenCalledWith(
        'nub',
        ['remove', '--global', 'expo-cli'],
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

      const nub = new NubPackageManager({ cwd: projectRoot });
      expect(nub.workspaceRoot()).toBeNull();
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

      const nub = new NubPackageManager({ cwd: projectRoot });
      const root = nub.workspaceRoot();
      expect(root).toBeInstanceOf(NubPackageManager);
      expect(root).not.toBe(nub);
    });
  });
});
