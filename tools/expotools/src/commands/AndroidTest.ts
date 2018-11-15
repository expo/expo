import path from 'path';
import spawnAsync from '@expo/spawn-async';

import { DeviceFarm, Directories, FirebaseTestLab, TestSuite } from '../expotools';

const ANDROID_DIR = path.join(Directories.getExpoRepositoryRootDir(), 'android');

export async function runLocalAndroidTestsAsync(env: { [key: string]: string } = {}) {
  await spawnAsync('./gradlew', [':app:connectedDevMinSdkDevKernelDebugAndroidTest'], {
    cwd: ANDROID_DIR,
    stdio: 'inherit',
    env: {
      ...process.env,
      ...env,
    },
  });
}

async function action(options) {
  let testSuiteUri;
  let shouldShutDownServer = false;

  if (options.publish) {
    testSuiteUri = await TestSuite.publishTestSuiteAsync();
  } else {
    testSuiteUri = await TestSuite.getUrlIfRunningAsync();

    if (testSuiteUri) {
      console.log(`test-suite is already running. Using this URL: ${testSuiteUri}`);
    } else {
      console.log(
        'Starting test-suite server. If you want this to be faster you can leave test-suite running in another tab.'
      );
      shouldShutDownServer = true;
      testSuiteUri = await TestSuite.startServerAsync();
    }
  }

  let env = {
    TEST_SUITE_URI: testSuiteUri,
    TEST_CONFIG: JSON.stringify({
      includeModules: [options.module || '.*'],
      includeSdkVersions: ['UNVERSIONED'],
      includeTestTypes: ['test-suite'],
    }),
  };

  try {
    if (options.local) {
      await runLocalAndroidTestsAsync(env);
    } else if (options.firebase) {
      await FirebaseTestLab.buildLocalAndroidAndRunTestAsync(env);
    } else {
      let arn = await DeviceFarm.buildLocalAndroidAndRunTestAsync(env);
      let runLink = DeviceFarm.getRunUrl(arn);
      console.log(`Created run with ARN ${arn}. View this run at ${runLink}.`);
      let runResult = await DeviceFarm.waitForRunAsync(arn);
      console.log(`Run result: ${runResult}`);
    }
  } finally {
    if (shouldShutDownServer) {
      await TestSuite.stopServerAsync();
    }
  }
}

export default (program: any) => {
  program
    .command('android-test')
    .description('Runs android tests on AWS Device Farm')
    .option('-l, --local', 'Runs tests on local device instead of on Device Farm')
    .option('--firebase', 'Runs tests on Firebase Test Lab instead of Device Farm')
    .option('--module [regex]', 'Filter which modules to run using a regex')
    .option(
      '-p, --publish',
      'Publishes test-suite and uses that url to run the tests instead of keeping a server running'
    )
    .asyncAction(action);
};
