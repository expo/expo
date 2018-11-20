import aws from 'aws-sdk';
import * as DeviceFarm from 'aws-sdk/clients/devicefarm';
import fs from 'fs';
import path from 'path';
import request from 'request-promise-native';
import { promisify } from 'util';
import spawnAsync from '@expo/spawn-async';

import { getExpoRepositoryRootDir } from './Directories';
import sleepAsync from './utils/sleepAsync';

const fsReadFileAsync = promisify(fs.readFile);

const EXPO_PROJECT_ARN =
  'arn:aws:devicefarm:us-west-2:274251141632:project:56f7808b-bf2c-4e34-b14b-5cf148fc7bb7';
const DEVICE_POOL_ARN =
  'arn:aws:devicefarm:us-west-2:274251141632:devicepool:56f7808b-bf2c-4e34-b14b-5cf148fc7bb7/9679b606-ceed-4b73-91e8-90cb4446bb62';

const ANDROID_DIR = path.join(getExpoRepositoryRootDir(), 'android');

let _deviceFarm: aws.DeviceFarm | null = null;

async function _getDeviceFarmAsync(): Promise<aws.DeviceFarm> {
  if (_deviceFarm) {
    return _deviceFarm;
  }

  let accessKeyId;
  let secretAccessKey;
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  } else {
    console.log('Defaulting to AWS credentials on local machine.');
  }

  _deviceFarm = new aws.DeviceFarm({
    signatureVersion: 'v4',
    region: 'us-west-2',
    accessKeyId,
    secretAccessKey,
  });

  return _deviceFarm;
}

async function _putRequestAsync(file: string, url: string) {
  let data = await fsReadFileAsync(file);
  return await request({
    method: 'PUT',
    url,
    body: data,
  });
}

// Name must end in .apk
// Returns ARN for uploaded apk
async function _uploadApkAsync(
  name: string,
  path: string,
  type: string
): Promise<DeviceFarm.AmazonResourceName> {
  if (!name.endsWith('.apk')) {
    throw new Error(`Name ${name} does not end with ".apk"`);
  }

  let deviceFarm = await _getDeviceFarmAsync();
  let uploadResponse = await deviceFarm
    .createUpload({
      name,
      type,
      projectArn: EXPO_PROJECT_ARN,
    })
    .promise();

  // Actually upload the apk
  let putUrl = uploadResponse.upload!.url!;
  await _putRequestAsync(path, putUrl);

  // Make sure it worked
  let uploadArn = uploadResponse.upload!.arn!;
  let result = await deviceFarm.getUpload({ arn: uploadArn }).promise();

  if (result.upload!.status! !== 'SUCCEEDED') {
    throw new Error(`Upload failed: ${JSON.stringify(result.upload)}`);
  }

  return uploadArn;
}

export async function uploadAndroidAppAsync(name: string, path: string) {
  return await _uploadApkAsync(name, path, 'ANDROID_APP');
}

export async function uploadAndroidTestAsync(name: string, path: string) {
  return await _uploadApkAsync(name, path, 'INSTRUMENTATION_TEST_PACKAGE');
}

export async function runAndroidTestsAsync(
  pathToAppApk: string,
  pathToTestApk: string
): Promise<DeviceFarm.AmazonResourceName> {
  let uploadResults = await Promise.all([
    uploadAndroidAppAsync('ExpoApp.apk', pathToAppApk),
    uploadAndroidTestAsync('ExpoTests.apk', pathToTestApk),
  ]);

  await sleepAsync(60 * 1000);

  let deviceFarm = await _getDeviceFarmAsync();
  let runResult = await deviceFarm
    .scheduleRun({
      name: 'ExpoAndroid',
      devicePoolArn: DEVICE_POOL_ARN,
      projectArn: EXPO_PROJECT_ARN,
      test: {
        type: 'INSTRUMENTATION',
        testPackageArn: uploadResults[1],
      },
      appArn: uploadResults[0],
    })
    .promise();

  return runResult.run!.arn!;
}

export async function buildLocalAndroidAndRunTestAsync(
  env: { [key: string]: any } = {}
): Promise<DeviceFarm.AmazonResourceName> {
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

export function getRunUrl(arn: DeviceFarm.AmazonResourceName): string {
  // arn looks like "arn:aws:devicefarm:us-west-2:274251141632:run:56f7808b-bf2c-4e34-b14b-5cf148fc7bb7/a7661ff2-c6d4-422d-834e-995efcd01ae6"
  // link looks like "https://us-west-2.console.aws.amazon.com/devicefarm/home?region=us-west-1#/projects/56f7808b-bf2c-4e34-b14b-5cf148fc7bb7/runs/a7661ff2-c6d4-422d-834e-995efcd01ae6".
  return (
    'https://us-west-2.console.aws.amazon.com/devicefarm/home?region=us-west-1#/projects/' +
    arn.substring(arn.lastIndexOf(':') + 1).replace('/', '/runs/')
  );
}

export async function getRunResultAsync(
  arn: DeviceFarm.AmazonResourceName
): Promise<DeviceFarm.ExecutionResult> {
  let deviceFarm = await _getDeviceFarmAsync();
  let result = await deviceFarm
    .getRun({
      arn,
    })
    .promise();

  return result.run!.result!;
}

// Returns PASSED, WARNED, FAILED, SKIPPED, ERRORED, STOPPED
export async function waitForRunAsync(
  arn: DeviceFarm.AmazonResourceName
): Promise<DeviceFarm.ExecutionResult> {
  let result: string;
  do {
    console.log(`Waiting on Device Farm build ${arn}...`);
    result = await getRunResultAsync(arn);
    await sleepAsync(10 * 1000);
  } while (result === 'PENDING');
  return result;
}
