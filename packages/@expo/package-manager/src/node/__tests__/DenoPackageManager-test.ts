import spawnAsync from '@expo/spawn-async';
import { vol } from 'memfs';
import path from 'path';

import { mockSpawnPromise } from '../../__tests__/spawn-utils';
import { DenoPackageManager } from '../DenoPackageManager';

jest.mock('@expo/spawn-async');
// Jest doesn't mock `node:fs` when mocking `fs`
jest.mock('fs', () => require('memfs').fs);
jest.mock('node:fs', () => require('memfs').fs);

beforeAll(() => {
  // Disable logging to clean up test ouput
  jest.spyOn(console, 'log').mockImplementation();
});

describe('DenoPackageManager', () => {
  const projectRoot = '/project/with-deno';

  it('name is set to deno', () => {
    const deno = new DenoPackageManager({ cwd: projectRoot });
    expect(deno.name).toBe('deno');
  });

  describe('getDefaultEnvironment', () => {
    it('runs deno with ADBLOCK=1 and DISABLE_OPENCOLLECTIVE=1', async () => {
      const deno = new DenoPackageManager({ cwd: projectRoot });
      await deno.installAsync();

      expect(spawnAsync).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          env: expect.objectContaining({ ADBLOCK: '1', DISABLE_OPENCOLLECTIVE: '1' }),
        })
      );
    });

    it('runs with overwritten default environment', async () => {
      const deno = new DenoPackageManager({ cwd: projectRoot, env: { ADBLOCK: '0' } });
      await deno.installAsync();

      expect(spawnAsync).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          env: { ADBLOCK: '0', DISABLE_OPENCOLLECTIVE: '1' },
        })
      );
    });
  });

  describe('runBinAsync', () => {
    it('executes deno with the expected command and options', async () => {
      const deno = new DenoPackageManager({ cwd: projectRoot });
      await deno.runBinAsync(['eslint', '.']);

      expect(spawnAsync).toHaveBeenCalledWith(
        'deno',
        expect.arrayContaining(['eslint', '.']),
        expect.objectContaining({ cwd: projectRoot })
      );
    });
  });

  describe('runAsync', () => {
    it('logs executed command', async () => {
      const log = jest.fn();
      const deno = new DenoPackageManager({ cwd: projectRoot, log });
      await deno.runAsync(['install', '--some-flag']);
      expect(log).toHaveBeenCalledWith('> deno install --some-flag');
    });

    it('inherits stdio output without silent', async () => {
      const deno = new DenoPackageManager({ cwd: projectRoot });
      await deno.runAsync(['install']);

      expect(spawnAsync).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ stdio: 'inherit' })
      );
    });

    it('does not inherit stdio with silent', async () => {
      const deno = new DenoPackageManager({ cwd: projectRoot, silent: true });
      await deno.runAsync(['install']);

      expect(spawnAsync).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ stdio: undefined })
      );
    });

    it('adds a single package with custom parameters', async () => {
      const deno = new DenoPackageManager({ cwd: projectRoot });
      await deno.runAsync(['add', '--dev', '@babel/core']);

      expect(spawnAsync).toHaveBeenCalledWith(
        'deno',
        ['add', '--dev', '@babel/core'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('adds multiple packages with custom parameters', async () => {
      const deno = new DenoPackageManager({ cwd: projectRoot });
      await deno.runAsync(['add', '--dev', '@babel/core', '@babel/runtime']);

      expect(spawnAsync).toHaveBeenCalledWith(
        'deno',
        ['add', '--dev', '@babel/core', '@babel/runtime'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });
  });

  describe('versionAsync', () => {
    it('returns version from deno', async () => {
      jest
        .mocked(spawnAsync)
        .mockImplementation(() => mockSpawnPromise(Promise.resolve({ stdout: '2.9.0\n' })));

      const deno = new DenoPackageManager({ cwd: projectRoot });

      expect(await deno.versionAsync()).toBe('2.9.0');
      expect(spawnAsync).toHaveBeenCalledWith('deno', ['--version'], expect.anything());
    });
  });

  describe('installAsync', () => {
    it('runs normal installation', async () => {
      const deno = new DenoPackageManager({ cwd: projectRoot });
      await deno.installAsync();

      expect(spawnAsync).toHaveBeenCalledWith(
        'deno',
        ['install'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('runs installation with flags', async () => {
      const deno = new DenoPackageManager({ cwd: projectRoot });
      await deno.installAsync(['--frozen']);

      expect(spawnAsync).toHaveBeenCalledWith(
        'deno',
        ['install', '--frozen'],
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

      const deno = new DenoPackageManager({ cwd: projectRoot });
      await deno.uninstallAsync();

      expect(vol.existsSync(path.join(projectRoot, 'node_modules'))).toBe(false);
    });

    it('skips removing non-existing node_modules folder', async () => {
      vol.fromJSON({ 'package.json': '{}' }, projectRoot);

      const deno = new DenoPackageManager({ cwd: projectRoot });
      await deno.uninstallAsync();

      expect(vol.existsSync(path.join(projectRoot, 'node_modules'))).toBe(false);
    });

    it('fails when no cwd is provided', async () => {
      const deno = new DenoPackageManager({ cwd: undefined });
      await expect(deno.uninstallAsync()).rejects.toThrow('cwd is required');
    });
  });

  describe('addAsync', () => {
    it('installs project without packages', async () => {
      const deno = new DenoPackageManager({ cwd: projectRoot });
      await deno.addAsync();

      expect(spawnAsync).toHaveBeenCalledWith(
        'deno',
        ['install'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('adds a single package to dependencies', async () => {
      const deno = new DenoPackageManager({ cwd: projectRoot });
      await deno.addAsync(['@react-navigation/native']);

      expect(spawnAsync).toHaveBeenCalledWith(
        'deno',
        ['add', '@react-navigation/native'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('adds multiple packages to dependencies', async () => {
      const deno = new DenoPackageManager({ cwd: projectRoot });
      await deno.addAsync(['@react-navigation/native', '@react-navigation/drawer']);

      expect(spawnAsync).toHaveBeenCalledWith(
        'deno',
        ['add', '@react-navigation/native', '@react-navigation/drawer'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });
  });

  describe('addDevAsync', () => {
    it('installs project without packages', async () => {
      const deno = new DenoPackageManager({ cwd: projectRoot });
      await deno.addDevAsync();

      expect(spawnAsync).toHaveBeenCalledWith(
        'deno',
        ['install'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('adds a single package to dev dependencies', async () => {
      const deno = new DenoPackageManager({ cwd: projectRoot });
      await deno.addDevAsync(['eslint']);

      expect(spawnAsync).toHaveBeenCalledWith(
        'deno',
        ['add', '--dev', 'eslint'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('adds multiple packages to dev dependencies', async () => {
      const deno = new DenoPackageManager({ cwd: projectRoot });
      await deno.addDevAsync(['eslint', 'prettier']);

      expect(spawnAsync).toHaveBeenCalledWith(
        'deno',
        ['add', '--dev', 'eslint', 'prettier'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });
  });

  describe('addGlobalAsync', () => {
    it('installs project without packages', async () => {
      const deno = new DenoPackageManager({ cwd: projectRoot });
      await deno.addGlobalAsync();

      expect(spawnAsync).toHaveBeenCalledWith(
        'deno',
        ['install'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('adds a single package globally with the npm registry prefix', async () => {
      const deno = new DenoPackageManager({ cwd: projectRoot });
      await deno.addGlobalAsync(['expo-cli@^5']);

      expect(spawnAsync).toHaveBeenCalledWith(
        'deno',
        ['install', '--global', 'npm:expo-cli@^5'],
        expect.anything()
      );
    });

    it('adds multiple packages globally with the npm registry prefix', async () => {
      const deno = new DenoPackageManager({ cwd: projectRoot });
      await deno.addGlobalAsync(['expo-cli@^5', 'eas-cli']);

      expect(spawnAsync).toHaveBeenCalledWith(
        'deno',
        ['install', '--global', 'npm:expo-cli@^5', 'npm:eas-cli'],
        expect.anything()
      );
    });

    it('keeps prefixed specifiers and flags as-is', async () => {
      const deno = new DenoPackageManager({ cwd: projectRoot });
      await deno.addGlobalAsync(['--force', 'npm:expo-cli@^5', 'jsr:@std/http']);

      expect(spawnAsync).toHaveBeenCalledWith(
        'deno',
        ['install', '--global', '--force', 'npm:expo-cli@^5', 'jsr:@std/http'],
        expect.anything()
      );
    });
  });

  describe('removeAsync', () => {
    it('removes a single package', async () => {
      const deno = new DenoPackageManager({ cwd: projectRoot });
      await deno.removeAsync(['metro']);

      expect(spawnAsync).toHaveBeenCalledWith(
        'deno',
        ['remove', 'metro'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('removes multiple packages', async () => {
      const deno = new DenoPackageManager({ cwd: projectRoot });
      await deno.removeAsync(['metro', 'jest-haste-map']);

      expect(spawnAsync).toHaveBeenCalledWith(
        'deno',
        ['remove', 'metro', 'jest-haste-map'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });
  });

  describe('removeDevAsync', () => {
    it('removes a single package', async () => {
      const deno = new DenoPackageManager({ cwd: projectRoot });
      await deno.removeDevAsync(['metro']);

      expect(spawnAsync).toHaveBeenCalledWith(
        'deno',
        ['remove', 'metro'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('removes multiple packages', async () => {
      const deno = new DenoPackageManager({ cwd: projectRoot });
      await deno.removeDevAsync(['metro', 'jest-haste-map']);

      expect(spawnAsync).toHaveBeenCalledWith(
        'deno',
        ['remove', 'metro', 'jest-haste-map'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });
  });

  describe('removeGlobalAsync', () => {
    it('removes a single package', async () => {
      const deno = new DenoPackageManager({ cwd: projectRoot });
      await deno.removeGlobalAsync(['expo-cli']);

      expect(spawnAsync).toHaveBeenCalledWith(
        'deno',
        ['uninstall', '--global', 'expo-cli'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });

    it('removes multiple packages', async () => {
      const deno = new DenoPackageManager({ cwd: projectRoot });
      await deno.removeGlobalAsync(['expo-cli', 'eas-cli']);

      expect(spawnAsync).toHaveBeenCalledWith(
        'deno',
        ['uninstall', '--global', 'expo-cli', 'eas-cli'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });
  });

  describe('workspaceRoot', () => {
    const workspaceRoot = '/monorepo';
    const projectRoot = '/monorepo/packages/test';

    afterEach(() => vol.reset());

    it('returns null for non-monorepo project', () => {
      vol.fromJSON(
        {
          'package.json': JSON.stringify({ name: 'project' }),
        },
        projectRoot
      );

      const deno = new DenoPackageManager({ cwd: projectRoot });
      expect(deno.workspaceRoot()).toBeNull();
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

      const deno = new DenoPackageManager({ cwd: projectRoot });
      const root = deno.workspaceRoot();
      expect(root).toBeInstanceOf(DenoPackageManager);
      expect(root).not.toBe(deno);
    });
  });
});
