import JsonFile from '@expo/json-file';
import {
  isMultipartPartWithName,
  parseMultipartMixedResponseAsync,
} from '@expo/multipart-body-parser';
import spawnAsync from '@expo/spawn-async';
import { Project, UrlUtils } from '@expo/xdl';
import chalk from 'chalk';
import crypto from 'crypto';
import ip from 'ip';
import fetch, { Response } from 'node-fetch';
import os from 'os';
import path from 'path';

import { EXPO_GO_DIR } from '../Constants';
import { getExpoRepositoryRootDir } from '../Directories';
import { getExpoGoSDKVersionAsync } from '../ProjectVersions';

interface Manifest {
  id: string;
  createdAt: string;
  runtimeVersion: string;
  metadata: { [key: string]: string };
  extra: {
    eas: {
      projectId: string;
    };
    expoClient?: {
      name: string;
    };
  };
}

// some files are absent on turtle builders and we don't want log errors there
const isTurtle = !!process.env.TURTLE_WORKING_DIR_PATH;

type AssetRequestHeaders = { authorization: string };

async function getManifestBodyAsync(response: Response): Promise<{
  manifest: Manifest;
  assetRequestHeaders: {
    [assetKey: string]: AssetRequestHeaders;
  };
}> {
  const contentType = response.headers.get('content-type');
  if (!contentType) {
    throw new Error('The multipart manifest response is missing the content-type header');
  }

  if (contentType === 'application/expo+json' || contentType === 'application/json') {
    const text = await response.text();
    return { manifest: JSON.parse(text), assetRequestHeaders: {} };
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

  const extensionsPart = multipartParts.find((part) => isMultipartPartWithName(part, 'extensions'));
  const assetRequestHeaders = extensionsPart
    ? JSON.parse(extensionsPart.body).assetRequestHeaders
    : {};

  return { manifest: JSON.parse(manifestPart.body), assetRequestHeaders };
}

async function getManifestAsync(
  url: string,
  platform: string
): Promise<{
  manifest: Manifest;
  assetRequestHeaders: {
    [assetKey: string]: AssetRequestHeaders;
  };
}> {
  const response = await fetch(url.replace('exp://', 'http://').replace('exps://', 'https://'), {
    method: 'GET',
    headers: {
      accept: 'multipart/mixed,application/expo+json,application/json',
      'expo-platform': platform,
    },
  });
  return await getManifestBodyAsync(response);
}

async function getSavedDevHomeEASUpdateUrlAsync(): Promise<string> {
  const devHomeConfig = await new JsonFile(
    path.join(getExpoRepositoryRootDir(), 'dev-home-config.json')
  ).readAsync();
  return devHomeConfig.url as string;
}

function kernelManifestAndAssetRequestHeadersObjectToJson(obj: {
  manifest: Manifest;
  assetRequestHeaders: {
    [assetKey: string]: AssetRequestHeaders;
  };
}) {
  return JSON.stringify(obj);
}

export default {
  async TEST_APP_URI() {
    if (process.env.TEST_SUITE_URI) {
      return process.env.TEST_SUITE_URI;
    } else {
      try {
        const testSuitePath = path.join(__dirname, '..', '..', '..', 'apps', 'test-suite');
        const status = await Project.currentStatus(testSuitePath);
        if (status === 'running') {
          return await UrlUtils.constructManifestUrlAsync(testSuitePath);
        } else {
          return '';
        }
      } catch {
        return '';
      }
    }
  },

  async TEST_CONFIG() {
    if (process.env.TEST_CONFIG) {
      return process.env.TEST_CONFIG;
    } else {
      return '';
    }
  },

  async TEST_SERVER_URL() {
    let url = 'TODO';

    try {
      const lanAddress = ip.address();
      const localServerUrl = `http://${lanAddress}:3013`;
      const response = await fetch(`${localServerUrl}/expo-test-server-status`, { timeout: 500 });
      const data = await response.text();
      if (data === 'running!') {
        url = localServerUrl;
      }
    } catch {}

    return url;
  },

  async TEST_RUN_ID() {
    return process.env.UNIVERSE_BUILD_ID || crypto.randomUUID();
  },

  async BUILD_MACHINE_LOCAL_HOSTNAME() {
    if (process.env.SHELL_APP_BUILDER) {
      return '';
    }

    try {
      const result = await spawnAsync('scutil', ['--get', 'LocalHostName']);
      return `${result.stdout.trim()}.local`;
    } catch (e) {
      if (e.code !== 'ENOENT') {
        console.error(e.stack);
      }
      return os.hostname();
    }
  },

  async DEV_PUBLISHED_KERNEL_MANIFEST(platform) {
    let manifestAndAssetRequestHeaders: {
      manifest: Manifest;
      assetRequestHeaders: {
        [assetKey: string]: AssetRequestHeaders;
      };
    };
    let savedDevHomeUrl: string | undefined;
    try {
      savedDevHomeUrl = await getSavedDevHomeEASUpdateUrlAsync();
      manifestAndAssetRequestHeaders = await getManifestAsync(savedDevHomeUrl, platform);
    } catch (e) {
      const msg = `Unable to download manifest from ${savedDevHomeUrl ?? '(error)'}: ${e.message}`;
      console[isTurtle ? 'debug' : 'error'](msg);
      return '';
    }

    return kernelManifestAndAssetRequestHeadersObjectToJson(manifestAndAssetRequestHeaders);
  },

  async BUILD_MACHINE_KERNEL_MANIFEST(platform) {
    if (process.env.SHELL_APP_BUILDER) {
      return '';
    }

    if (process.env.CI) {
      console.log('Skip fetching local manifest on CI.');
      return '';
    }

    const url = await UrlUtils.constructManifestUrlAsync(EXPO_GO_DIR);

    try {
      const manifestAndAssetRequestHeaders = await getManifestAsync(url, platform);

      if (manifestAndAssetRequestHeaders.manifest.extra?.expoClient?.name !== 'expo-home') {
        console.log(
          `Manifest at ${url} is not expo-home; using published kernel manifest instead...`
        );
        return '';
      }
      return kernelManifestAndAssetRequestHeadersObjectToJson(manifestAndAssetRequestHeaders);
    } catch {
      console.error(
        chalk.red(
          `Unable to generate manifest from ${chalk.cyan(
            EXPO_GO_DIR
          )}: Failed to fetch manifest from ${chalk.cyan(url)}`
        )
      );
      return '';
    }
  },

  async TEMPORARY_SDK_VERSION(): Promise<string> {
    return await getExpoGoSDKVersionAsync();
  },
};
