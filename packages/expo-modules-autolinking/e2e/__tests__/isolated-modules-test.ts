import spawnAsync from '@expo/spawn-async';
import fs from 'fs';
import path from 'path';
import temporary from 'tempy';

import { autolinkingRunAsync } from '../TestUtils';

const platforms = ['android', 'ios'];

describe('isolated modules', () => {
  let projectDir: string | undefined;

  function removeProjectPath(str: string | undefined): string | undefined {
    return str?.replace(projectDir || '', 'app');
  }

  beforeAll(async () => {
    const tempDir = path.join(temporary.directory(), 'isolated-modules');
    await fs.promises.mkdir(tempDir, { recursive: true });
    console.log(`Creating project into: ${tempDir}`);
    await spawnAsync('pnpx', ['create-expo-app', '.', '--template', 'tabs'], { cwd: tempDir });
    projectDir = tempDir;
  }, 5 * 60 * 1000);

  describe('resolve', () => {
    test.each(platforms)(`resolves isolated modules on %s`, async (platform) => {
      const resolveResult = await autolinkingRunAsync(
        ['resolve', '--json', '--platform', platform],
        {
          cwd: projectDir,
        }
      );

      expect(resolveResult.status).toBe(0);

      const { modules } = JSON.parse(resolveResult.stdout);
      const parsedModules = modules.map((module) => ({
        ...module,
        pods: module.pods?.map((pod) => ({
          ...pod,
          podspecDir: removeProjectPath(pod.podspecDir),
        })),
      }));

      expect(parsedModules).toMatchSnapshot();
    });
  });

  describe('verify', () => {
    test.each(platforms)(`verifies isolated modules on %s`, async (platform) => {
      const verifyResult = await autolinkingRunAsync(['verify', '--platform', platform], {
        cwd: projectDir,
      });
      expect(verifyResult.status).toBe(0);
      expect(verifyResult.stdout).toMatchSnapshot();
    });
  });

  describe('search', () => {
    test.each(platforms)('searches isolated modules on %s', async (platform) => {
      const searchResults = await autolinkingRunAsync(['search', '--json'], {
        cwd: projectDir,
      });
      expect(searchResults.status).toBe(0);

      const modules = JSON.parse(searchResults.stdout);
      for (const key in modules) {
        const module = modules[key];
        module.path = removeProjectPath(module.path);
        module.duplicates = module.duplicates.map((conflict) => ({
          ...conflict,
          path: removeProjectPath(conflict.path),
        }));
      }
      expect(modules).toMatchSnapshot();
    });
  });

  describe('generate-package-list', () => {
    test.each(platforms)('generates package list on %s', async (platform) => {
      const target = path.join(projectDir || '', 'generated', 'file.txt');
      const namespace = 'com.test';
      const generatePackageListResult = await autolinkingRunAsync(
        [
          'generate-package-list',
          '--platform',
          platform,
          '--target',
          target,
          '--namespace',
          namespace,
        ],
        {
          cwd: projectDir,
        }
      );

      expect(generatePackageListResult.status).toBe(0);
      const generatedFile = await fs.promises.readFile(target, 'utf-8');
      expect(generatedFile).toMatchSnapshot();
    });
  });
});
