const spawnAsync = require('@expo/spawn-async');
const fs = require('fs/promises');
const glob = require('glob');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const notifyStrings = [
  'test-update-1',
  'test-update-2',
  'test-update-3',
  'test-update-invalid-hash',
  'test-update-older',
  'test-assets-1',
];

createTestUpdateBundles(projectRoot, notifyStrings);

///////////////////////////////////////////////////////////////

/**
 * Originally, the E2E tests would directly modify the text of the minified JS in update bundles
 * when testing to make sure that the correct update was applied.
 *
 * Since Hermes bundles are bytecode and not readable JS, we instead pre-generate Hermes bundles
 * corresponding to each test case, and save them in the `test-update-bundles` directory in the test app.
 */
async function createTestUpdateBundles(projectRoot, notifyStrings) {
  // export update for test server to host
  await createUpdateBundleAsync(projectRoot);

  // move exported update to "updates" directory for EAS testing
  await fs.rm(path.join(projectRoot, 'updates'), { recursive: true, force: true });
  await fs.rename(path.join(projectRoot, 'dist'), path.join(projectRoot, 'updates'));

  const testUpdateBundlesPath = path.join(projectRoot, 'test-update-bundles');
  await fs.rm(testUpdateBundlesPath, { recursive: true, force: true });
  await fs.mkdir(testUpdateBundlesPath);
  const appJsPath = path.join(projectRoot, 'App.tsx');
  const originalAppJs = await fs.readFile(appJsPath, 'utf-8');
  const testUpdateJson = {};
  for (const notifyString of ['test', ...notifyStrings]) {
    console.log(`Creating bundle for string '${notifyString}'...`);
    const modifiedAppJs = originalAppJs.replace(
      /testID="updateString" value="test"/g,
      `testID="updateString" value="${notifyString}"`
    );
    await fs.rm(appJsPath);
    await fs.writeFile(appJsPath, modifiedAppJs, 'utf-8');
    await createUpdateBundleAsync(projectRoot);
    const manifestJsonString = await fs.readFile(
      path.join(projectRoot, 'dist', 'metadata.json'),
      'utf-8'
    );
    const manifest = JSON.parse(manifestJsonString);
    const iosBundlePath = path.join(projectRoot, 'dist', manifest.fileMetadata.ios.bundle);
    const androidBundlePath = path.join(projectRoot, 'dist', manifest.fileMetadata.android.bundle);
    const iosBundleDestPath = path.join(testUpdateBundlesPath, path.basename(iosBundlePath));
    const androidBundleDestPath = path.join(
      testUpdateBundlesPath,
      path.basename(androidBundlePath)
    );
    await fs.copyFile(iosBundlePath, iosBundleDestPath);
    await fs.copyFile(androidBundlePath, androidBundleDestPath);
    testUpdateJson[notifyString] = {
      ios: path.basename(iosBundlePath),
      android: path.basename(androidBundlePath),
    };
  }
  const testUpdateBundlesJsonPath = path.join(testUpdateBundlesPath, 'test-updates.json');
  await fs.writeFile(testUpdateBundlesJsonPath, JSON.stringify(testUpdateJson, null, 2), 'utf-8');
  await fs.rm(appJsPath);
  await fs.writeFile(appJsPath, originalAppJs, 'utf-8');
  console.log('Done creating test bundles');
}

async function createUpdateBundleAsync(projectRoot, localCliBin) {
  await fs.rm(path.join(projectRoot, 'dist'), { force: true, recursive: true });
  await spawnAsync('npx', ['expo', 'export'], {
    cwd: projectRoot,
    stdio: 'inherit',
  });
}
