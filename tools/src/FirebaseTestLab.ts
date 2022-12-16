import spawnAsync from '@expo/spawn-async';
import path from 'path';

import { getExpoRepositoryRootDir } from './Directories';

const ANDROID_DIR = path.join(getExpoRepositoryRootDir(), 'android');

export async function runAndroidTestsAsync(
  pathToAppApk: string,
  pathToTestApk: string
): Promise<void> {
  await spawnAsync(
    'gcloud',
    [
      'firebase',
      'test',
      'android',
      'run',
      '--type',
      'instrumentation',
      '--app',
      pathToAppApk,
      '--test',
      pathToTestApk,
      '--device',
      'model=Nexus6,version=25,locale=en,orientation=portrait',
    ],
    {
      stdio: 'inherit',
    }
  );
}

export async function buildLocalAndroidAndRunTestAsync(
  env: { [key: string]: any } = {}
): Promise<void> {
  await spawnAsync('./gradlew', [':app:assembleDebug'], {
    cwd: ANDROID_DIR,
    env: {
      ...process.env,
      ...env,
    },
  });

  await spawnAsync('./gradlew', [':app:assembleDebugAndroidTest'], {
    cwd: ANDROID_DIR,
    env: {
      ...process.env,
      ...env,
    },
  });

  return await runAndroidTestsAsync(
    path.join(ANDROID_DIR, 'app/build/outputs/apk/debug/app-debug.apk'),
    path.join(ANDROID_DIR, 'app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk')
  );
}
