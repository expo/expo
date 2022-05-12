import spawnAsync from '@expo/spawn-async';
import path from 'path';

const BUNDLE_IDENTIFIER = 'dev.expo.updatese2e';
const APP_PATH = path.join(process.env.ARTIFACTS_DEST, 'ios-release.app');

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
