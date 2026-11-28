#!/usr/bin/env pnpm --silent ts-node --transpile-only

const spawnAsync = require('@expo/spawn-async');
const fs = require('fs/promises');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const defaultNotifyStrings = [
  'test-update-1',
  'test-update-2',
  'test-update-3',
  'test-assets-1',
];

const platform = process.argv[2];
const requestedNotifyStrings = process.argv.slice(3);
const notifyStrings =
  requestedNotifyStrings.length > 0 ? requestedNotifyStrings : defaultNotifyStrings;

createTestUpdateBundles(projectRoot, notifyStrings, platform);

///////////////////////////////////////////////////////////////

/**
 * Originally, the E2E tests would directly modify the text of the minified JS in update bundles
 * when testing to make sure that the correct update was applied.
 *
 * Since Hermes bundles are bytecode and not readable JS, we instead pre-generate Hermes bundles
 * corresponding to each test case, and save them in the `test-update-bundles` directory in the test app.
 */
async function createTestUpdateBundles(
  projectRoot: string,
  notifyStrings: string[],
  platform?: string
) {
  const testUpdateBundlesPath = path.join(projectRoot, 'test-update-bundles');
  await fs.rm(testUpdateBundlesPath, { recursive: true, force: true });
  await fs.mkdir(testUpdateBundlesPath);
  const appJsPath = path.join(projectRoot, 'App.tsx');
  const originalAppJs = await fs.readFile(appJsPath, 'utf-8');
  const testUpdateJson: { [k: string]: any } = {};
  try {
    for (const notifyString of notifyStrings) {
      console.log(`Creating bundle for string '${notifyString}'...`);
      let modifiedAppJs = originalAppJs.replace(
        /testID="updateString" value="test"/g,
        `testID="updateString" value="${notifyString}"`
      );

      if (notifyString === 'test-update-crashing') {
        modifiedAppJs = modifiedAppJs.replace('// REPLACE_WITH_CRASHING_CODE', 'blah.blah;');
      }

      await fs.writeFile(appJsPath, modifiedAppJs, 'utf-8');
      await createUpdateBundleAsync(projectRoot, platform);
      const manifestJsonString = await fs.readFile(
        path.join(projectRoot, 'dist', 'metadata.json'),
        'utf-8'
      );
      const manifest = JSON.parse(manifestJsonString);

      const platforms = platform ? [platform] : ['ios', 'android'];

      if (!testUpdateJson[notifyString]) {
        testUpdateJson[notifyString] = {};
      }

      for (const p of platforms) {
        const bundlePath = path.join(projectRoot, 'dist', manifest.fileMetadata[p].bundle);
        const bundleDestPath = path.join(testUpdateBundlesPath, path.basename(bundlePath));
        await fs.copyFile(bundlePath, bundleDestPath);
        testUpdateJson[notifyString][p] = path.basename(bundlePath);
      }

      if (notifyString === 'test-assets-1') {
        await fs.rm(path.join(projectRoot, 'updates'), { recursive: true, force: true });
        await fs.rename(path.join(projectRoot, 'dist'), path.join(projectRoot, 'updates'));
      }
    }
    const testUpdateBundlesJsonPath = path.join(testUpdateBundlesPath, 'test-updates.json');
    await fs.writeFile(testUpdateBundlesJsonPath, JSON.stringify(testUpdateJson, null, 2), 'utf-8');
    console.log('Done creating test bundles');
  } finally {
    await fs.writeFile(appJsPath, originalAppJs, 'utf-8');
  }
}

async function createUpdateBundleAsync(projectRoot: string, platform?: string) {
  await fs.rm(path.join(projectRoot, 'dist'), { force: true, recursive: true });
  const args = ['expo', 'export'];
  if (platform) {
    args.push('--platform', platform);
  } else {
    args.push('--platform', 'ios');
    args.push('--platform', 'android');
  }
  await spawnAsync('pnpm', args, {
    cwd: projectRoot,
    stdio: 'inherit',
  });
}
