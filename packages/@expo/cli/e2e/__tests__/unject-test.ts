/* eslint-env jest */
import execa from 'execa';
import fs from 'fs/promises';
import { sync as globSync } from 'glob';
import path from 'path';

import {
  bin,
  execute,
  projectRoot,
  getRoot,
  setupTestProjectAsync,
  getLoadedModulesAsync,
} from './utils';

const originalForceColor = process.env.FORCE_COLOR;
const originalCI = process.env.CI;

const templateFolder = path.join(__dirname, '../../../../../templates/expo-template-bare-minimum/');

function getTemplatePath() {
  const results = globSync(`*.tgz`, {
    absolute: true,
    cwd: templateFolder,
  });

  return results[0];
}

async function ensureTemplatePathAsync() {
  let templatePath = getTemplatePath();
  if (templatePath) return templatePath;
  await execa('npm', ['pack'], { cwd: templateFolder });

  templatePath = getTemplatePath();
  if (templatePath) return templatePath;

  throw new Error('Could not find template tarball');
}

beforeAll(async () => {
  await fs.mkdir(projectRoot, { recursive: true });
  process.env.FORCE_COLOR = '0';
  process.env.CI = '1';
});

afterAll(() => {
  process.env.FORCE_COLOR = originalForceColor;
  process.env.CI = originalCI;
});

it('loads expected modules by default', async () => {
  const modules = await getLoadedModulesAsync(`require('../../build/src/uneject').expoUneject`);
  expect(modules).toStrictEqual([
    '../node_modules/ansi-styles/index.js',
    '../node_modules/arg/index.js',
    '../node_modules/chalk/source/index.js',
    '../node_modules/chalk/source/util.js',
    '../node_modules/has-flag/index.js',
    '../node_modules/supports-color/index.js',
    '@expo/cli/build/src/log.js',
    '@expo/cli/build/src/uneject/index.js',
    '@expo/cli/build/src/utils/args.js',
  ]);
});

it('runs `npx expo uneject --help`', async () => {
  const results = await execute('uneject', '--help');
  expect(results.stdout).toMatchInlineSnapshot(`
    "
      Info
        Convert native iOS and Android project files into CNG patch files

      Usage
        $ npx expo uneject <dir>

      Options
        <dir>                                    Directory of the Expo project. Default: Current working directory
        --no-clean                               Skip cleaning native platform directories
        --template <template>                    Project template to clone from. File path pointing to a local tar file or a github repo
        -p, --platform <all|android|ios>         Platforms to sync: ios, android, all. Default: all
        -h, --help                               Usage info
    "
  `);
});

it('runs `npx expo uneject` asserts when expo is not installed', async () => {
  const projectName = 'basic-uneject-assert-no-expo';
  const projectRoot = getRoot(projectName);
  // Create the project root aot
  await fs.mkdir(projectRoot, { recursive: true });
  // Create a fake package.json -- this is a terminal file that cannot be overwritten.
  await fs.writeFile(path.join(projectRoot, 'package.json'), '{ "version": "1.0.0" }');
  await fs.writeFile(path.join(projectRoot, 'app.json'), '{ "expo": { "name": "foobar" } }');

  await expect(execute('uneject', projectName)).rejects.toThrowError(
    /Cannot determine which native SDK version your project uses because the module `expo` is not installed\. Please install it with `yarn add expo` and try again./
  );
});

it(
  'runs `npx expo uneject` should convert a project to CNG patches`',
  async () => {
    const projectRoot = await setupTestProjectAsync('basic-prebuild', 'with-blank');
    await fs.rm(path.join(projectRoot, 'cng-patches'), { recursive: true, force: true });

    const templateFolder = await ensureTemplatePathAsync();
    console.log('Using local template:', templateFolder);

    await execa(
      'node',
      [bin, 'prebuild', '--platform', 'android', '--no-install', '--template', templateFolder],
      {
        cwd: projectRoot,
      }
    );

    // Do some manual changes
    const appGradlePath = path.join(projectRoot, 'android', 'app', 'build.gradle');
    let contents = await fs.readFile(appGradlePath, 'utf8');
    contents = contents.replace('org.webkit:android-jsc:+', 'org.webkit:android-jsc-intl:+');
    await fs.writeFile(appGradlePath, contents, 'utf8');

    await execa('node', [bin, 'uneject', '--platform', 'android', '--template', templateFolder], {
      cwd: projectRoot,
    });

    let androidDirExists;
    try {
      await fs.stat(path.join(projectRoot, 'android'));
      androidDirExists = true;
    } catch {
      androidDirExists = false;
    }
    expect(androidDirExists).toBe(false);

    const patchContents = await fs.readFile(
      path.join(projectRoot, 'cng-patches', 'android.patch'),
      'utf8'
    );
    expect(patchContents).toMatch(`\
-def jscFlavor = 'org.webkit:android-jsc:+'
+def jscFlavor = 'org.webkit:android-jsc-intl:+'\
`);
  },
  // Could take 100s depending on how fast npm installs
  120 * 1000
);

it(
  'runs `npx expo uneject` should convert a project to CNG patches` and `npx expo prebuild` should apply the patches',
  async () => {
    const projectRoot = await setupTestProjectAsync('basic-prebuild', 'with-blank');
    await fs.rm(path.join(projectRoot, 'cng-patches'), { recursive: true, force: true });

    const templateFolder = await ensureTemplatePathAsync();
    console.log('Using local template:', templateFolder);

    await execa(
      'node',
      [bin, 'prebuild', '--platform', 'android', '--no-install', '--template', templateFolder],
      {
        cwd: projectRoot,
      }
    );

    // Do some manual changes
    const appGradlePath = path.join(projectRoot, 'android', 'app', 'build.gradle');
    const contents = await fs.readFile(appGradlePath, 'utf8');
    const patchedContents = contents.replace(
      'org.webkit:android-jsc:+',
      'org.webkit:android-jsc-intl:+'
    );
    await fs.writeFile(appGradlePath, patchedContents, 'utf8');

    await execa('node', [bin, 'uneject', '--platform', 'android', '--template', templateFolder], {
      cwd: projectRoot,
    });

    await execa(
      'node',
      [bin, 'prebuild', '--platform', 'android', '--no-install', '--template', templateFolder],
      {
        cwd: projectRoot,
      }
    );

    const contents2 = await fs.readFile(appGradlePath, 'utf8');
    expect(contents2).toBe(patchedContents);
  },
  // Could take 100s depending on how fast npm installs
  120 * 1000
);
