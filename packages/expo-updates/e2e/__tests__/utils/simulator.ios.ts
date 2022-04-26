import spawnAsync from '@expo/spawn-async';

const APP_PATH = process.env.TEST_APP_PATH;
const BUNDLE_IDENTIFIER = 'dev.expo.updatese2e';

export const ExportedManifestFilename = 'ios-index.json';

export async function installApp() {
  await spawnAsync('xcrun', ['simctl', 'install', 'booted', APP_PATH]);
}

export async function uninstallApp() {
  await spawnAsync('xcrun', ['simctl', 'uninstall', 'booted', BUNDLE_IDENTIFIER]);
}

export async function startApp() {
  await spawnAsync('xcrun', ['simctl', 'launch', 'booted', BUNDLE_IDENTIFIER]);
}

export async function stopApp() {
  await spawnAsync('xcrun', ['simctl', 'terminate', 'booted', BUNDLE_IDENTIFIER]);
}
