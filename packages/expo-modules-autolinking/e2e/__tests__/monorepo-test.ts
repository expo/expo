import os from 'os';
import fs from 'fs-extra';
import crypto from 'crypto';
import { join } from 'path';

import { GitDirectory } from '../../../../tools/src/Git';
import { autolinkingRunAsync, yarnSync, combinations } from '../TestUtils';

function tempDirectory() {
  const directory = join(fs.realpathSync(os.tmpdir()), crypto.randomBytes(16).toString('hex'));
  fs.mkdirSync(directory);
  return directory;
}

const monorepoConfig = {
  source: 'https://github.com/byCedric/eas-monorepo-example.git',
  ref: 'd4b45c663c5968d3f8fa0e915ce757e64b15f15e',
};

const apps = ['ejected', 'managed', 'with-sentry'];
const testCases = combinations('app', apps, 'platform', ['android', 'ios']);

describe('monorepo', () => {
  let monorepoProject: string | undefined;

  function removeProjectPath(str: string | undefined): string | undefined {
    return str?.replace(monorepoProject, 'monorepo');
  }

  function projectPath(app: string): string {
    return join(monorepoProject, 'apps', app);
  }

  beforeAll(async () => {
    const temp = join(tempDirectory(), 'monorepo');
    console.log(`Cloning monorepo into: ${temp}`);
    await GitDirectory.shallowCloneAsync(temp, monorepoConfig.source, monorepoConfig.ref);
    console.log('Yarning');
    yarnSync({ cwd: temp });
    monorepoProject = temp;
  }, 5 * 60 * 1000);

  afterAll(async () => {
    if (monorepoProject) {
      console.log(`Removing: ${monorepoProject}`);
      await fs.remove(monorepoProject);
    }
  });

  describe('resolve', () => {
    test.each(testCases)('%o', async ({ app, platform }) => {
      const resolveResult = await autolinkingRunAsync(
        ['resolve', '--json', '--platform', platform],
        {
          cwd: projectPath(app),
        }
      );

      expect(resolveResult.status).toBe(0);
      const { modules } = JSON.parse(resolveResult.stdout);
      const parsedModules = modules.map((module) => ({
        ...module,
        projects: module.projects?.map((project) => ({
          ...project,
          sourceDir: removeProjectPath(project.sourceDir),
        })),
        pods: module.pods?.map((pod) => ({
          ...pod,
          podspecDir: removeProjectPath(pod.podspecDir),
        })),
      }));

      expect(parsedModules).toMatchSnapshot();
    });
  });

  describe('verify', () => {
    test.each(testCases)('%o', async ({ app, platform }) => {
      const verifyResult = await autolinkingRunAsync(['verify', '--platform', platform], {
        cwd: projectPath(app),
      });
      expect(verifyResult.status).toBe(0);
      expect(verifyResult.stdout).toMatchSnapshot();
    });
  });

  describe('search', () => {
    test.each(apps)('%s', async (app) => {
      const searchResults = await autolinkingRunAsync(['search', '--json'], {
        cwd: projectPath(app),
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
    test.each(testCases)('%s', async ({ app, platform }) => {
      const appPath = projectPath(app);
      const target = join(appPath, 'generated', 'file.txt');
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
          cwd: appPath,
        }
      );

      expect(generatePackageListResult.status).toBe(0);
      const generatedFile = await fs.readFile(target, 'utf-8');
      expect(generatedFile).toMatchSnapshot();
    });
  });
});
