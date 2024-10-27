import { Command } from '@expo/commander';
import JsonFile from '@expo/json-file';
import {
  isMultipartPartWithName,
  parseMultipartMixedResponseAsync,
} from '@expo/multipart-body-parser';
import chalk from 'chalk';
import fs from 'fs/promises';
import fetch, { Response } from 'node-fetch';
import nullthrows from 'nullthrows';
import os from 'os';
import path from 'path';

import { EXPO_GO_ANDROID_DIR, EXPO_GO_IOS_DIR } from '../Constants';
import { deepCloneObject } from '../Utils';
import { Directories, EASUpdate } from '../expotools';
import AppConfig from '../typings/AppConfig';

type ExpoCliStateObject = {
  auth?: {
    username?: string;
  };
};

const EXPO_HOME_PATH = Directories.getExpoGoDir();

const iosPublishBundlePath = path.join(
  EXPO_GO_IOS_DIR,
  'Exponent',
  'Supporting',
  'kernel.ios.bundle'
);
const androidPublishBundlePath = path.join(
  EXPO_GO_ANDROID_DIR,
  'app',
  'src',
  'main',
  'assets',
  'kernel.android.bundle'
);
const iosManifestPath = path.join(
  EXPO_GO_IOS_DIR,
  'Exponent',
  'Supporting',
  'kernel-manifest.json'
);
const androidManifestPath = path.join(
  EXPO_GO_ANDROID_DIR,
  'app',
  'src',
  'main',
  'assets',
  'kernel-manifest.json'
);

/**
 * Returns path to production's expo-cli state file.
 */
function getExpoCliStatePath(): string {
  return path.join(os.homedir(), '.expo/state.json');
}

/**
 * Reads expo-cli state file which contains, among other things, session credentials to the account that you're logged in.
 */
async function getExpoCliStateAsync(): Promise<ExpoCliStateObject> {
  return JsonFile.readAsync<ExpoCliStateObject>(getExpoCliStatePath());
}

/**
 * Publishes @exponent/home app on EAS Update.
 */
async function publishAppAsync({
  slug,
  message,
}: {
  slug: string;
  message: string;
}): Promise<{ createdUpdateGroupId: string }> {
  console.log(`Publishing ${chalk.green(slug)}...`);

  const result = await EASUpdate.publishProjectWithEasCliAsync(EXPO_HOME_PATH, {
    branch: 'production',
    message,
  });

  console.log(
    `Done publishing ${chalk.green(slug)}. Update Group ID is: ${chalk.blue(
      result.createdUpdateGroupId
    )}`
  );

  return result;
}

interface Manifest {
  id: string;
  launchAsset: {
    key: string;
    url: string;
  };
}

type AssetRequestHeaders = { authorization: string };
type Extensions = { assetRequestHeaders: { [key: string]: AssetRequestHeaders } };

async function getManifestAndExtensionsAsync(response: Response): Promise<{
  manifest: Manifest;
  extensions: Extensions;
}> {
  const contentType = response.headers.get('content-type');
  if (!contentType) {
    throw new Error('The multipart manifest response is missing the content-type header');
  }

  const bodyBuffer = await response.arrayBuffer();
  const multipartParts = await parseMultipartMixedResponseAsync(
    contentType,
    Buffer.from(bodyBuffer)
  );

  const manifestPart = multipartParts.find((part) => isMultipartPartWithName(part, 'manifest'));
  if (!manifestPart) {
    throw new Error('The multipart manifest response is missing the manifest part');
  }
  const manifest: Manifest = JSON.parse(manifestPart.body);

  const extensionsPart = multipartParts.find((part) => isMultipartPartWithName(part, 'extensions'));
  if (!extensionsPart) {
    throw new Error('The multipart manifest response is missing the extensions part');
  }
  const extensions: Extensions = JSON.parse(extensionsPart.body);

  return { manifest, extensions };
}

async function fetchManifestAndBundleAsync(
  projectId: string,
  groupId: string,
  platform: 'ios' | 'android'
): Promise<void> {
  const manifestUrl = `https://u.expo.dev/${projectId}/group/${groupId}`;
  const manifestResponse = await fetch(manifestUrl, {
    method: 'GET',
    headers: {
      accept: 'multipart/mixed',
      'expo-platform': platform,
    },
  });
  const { manifest, extensions } = await getManifestAndExtensionsAsync(manifestResponse);

  const bundleUrl = manifest.launchAsset.url;
  const bundleRequestHeaders = nullthrows(
    extensions?.assetRequestHeaders[manifest.launchAsset.key]
  );

  const bundleResponse = await fetch(bundleUrl, {
    method: 'GET',
    headers: {
      ...bundleRequestHeaders,
    },
  });

  const manifestPath = platform === 'ios' ? iosManifestPath : androidManifestPath;
  await fs.writeFile(path.resolve(manifestPath), JSON.stringify(manifest));

  const bundlePath = platform === 'ios' ? iosPublishBundlePath : androidPublishBundlePath;
  await fs.writeFile(path.resolve(bundlePath), await bundleResponse.buffer());
}

/**
 * Main action that runs once the command is invoked.
 */
async function action(): Promise<void> {
  console.log('Getting expo-cli state of the current session...');
  const cliState = await getExpoCliStateAsync();
  const cliUsername = cliState?.auth?.username;
  if (cliUsername !== 'exponent') {
    throw new Error('Must be logged in as `exponent` account to publish');
  }

  const appJsonFilePath = path.join(EXPO_HOME_PATH, 'app.json');

  const slug = 'home';
  const owner = 'exponent';
  const easProjectId = '6b6c6660-df76-11e6-b9b4-59d1587e6774';
  const easUpdateURL = `https://u.expo.dev/${easProjectId}`;

  const appJsonFile = new JsonFile<AppConfig>(appJsonFilePath);
  const appJson = await appJsonFile.readAsync();

  if (!appJson.expo.owner) {
    throw new Error('app.json missing owner');
  }
  if (!appJson.expo.extra || !appJson.expo.extra.eas || !appJson.expo.extra.eas.projectId) {
    throw new Error('app.json missing extra.eas.projectId');
  }
  if (!appJson.expo.updates || !appJson.expo.updates.url) {
    throw new Error('app.json missing updates.url');
  }

  console.log(`Creating backup of ${chalk.magenta('app.json')} file...`);
  const appJsonBackup = deepCloneObject<AppConfig>(appJson);

  console.log(`Modifying home's slug to ${chalk.green(slug)}...`);
  appJson.expo.slug = slug;

  console.log(`Modifying home's owner to ${chalk.green(owner)}...`);
  appJson.expo.owner = owner;

  console.log(`Modifying home's EAS project ID to ${chalk.green(easProjectId)}...`);
  appJson.expo.extra.eas.projectId = easProjectId;

  console.log(`Modifying home's update URL to ${chalk.green(easUpdateURL)}...`);
  appJson.expo.updates.url = easUpdateURL;

  // Save the modified `appJson` to the file so it'll be used as a manifest.
  await appJsonFile.writeAsync(appJson);

  const createdUpdateGroupId = (
    await publishAppAsync({ slug, message: `Publish ${appJson.expo.sdkVersion}` })
  ).createdUpdateGroupId;

  console.log(`Restoring ${chalk.magenta('app.json')} file...`);
  await appJsonFile.writeAsync(appJsonBackup);

  console.log(`Downloading published manifests and bundles...`);
  await Promise.all([
    fetchManifestAndBundleAsync(easProjectId, createdUpdateGroupId, 'ios'),
    fetchManifestAndBundleAsync(easProjectId, createdUpdateGroupId, 'android'),
  ]);

  console.log(
    chalk.yellow(
      `Finished publishing. Remember to commit changes of the embedded manifests and bundles.`
    )
  );
}

export default (program: Command) => {
  program
    .command('publish-prod-home')
    .alias('pph')
    .description('Publishes home app for production on EAS Update.')
    .asyncAction(action);
};
