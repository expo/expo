import path from 'path';
import spawnAsync from '@expo/spawn-async';

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
  await spawnAsync('./gradlew', [':app:assembleDevMinSdkDevKernelDebug'], {
    cwd: ANDROID_DIR,
    env: {
      ...process.env,
      ...env,
    },
  });

  await spawnAsync('./gradlew', [':app:assembleDevMinSdkDevKernelDebugAndroidTest'], {
    cwd: ANDROID_DIR,
    env: {
      ...process.env,
      ...env,
    },
  });

  return await runAndroidTestsAsync(
    path.join(
      ANDROID_DIR,
      'app/build/outputs/apk/devMinSdkDevKernel/debug/app-devMinSdk-devKernel-debug.apk'
    ),
    path.join(
      ANDROID_DIR,
      'app/build/outputs/apk/androidTest/devMinSdkDevKernel/debug/app-devMinSdk-devKernel-debug-androidTest.apk'
    )
  );
}
