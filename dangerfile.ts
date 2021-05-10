import { checkChangelog, checkAndroidPermissions } from '@expo/danger';

async function run() {
  await checkChangelog();
  await checkAndroidPermissions();
}

run();
