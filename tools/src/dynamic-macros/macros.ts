import JsonFile from '@expo/json-file';
import spawnAsync from '@expo/spawn-async';
import { ExponentTools, Project, UrlUtils } from '@expo/xdl';
import chalk from 'chalk';
import crypto from 'crypto';
import ip from 'ip';
import fetch from 'node-fetch';
import os from 'os';
import path from 'path';

import { getExpoRepositoryRootDir } from '../Directories';
import { getHomeSDKVersionAsync } from '../ProjectVersions';

interface Manifest {
  id: string;
  name: string;
  extra?: {
    expoClient?: {
      name: string;
    };
  };
}

// some files are absent on turtle builders and we don't want log errors there
const isTurtle = !!process.env.TURTLE_WORKING_DIR_PATH;

const dogfoodingHomeUrl = 'exp://exp.host/@expo-dogfooding/home';

const EXPO_DIR = getExpoRepositoryRootDir();

async function getManifestAsync(
  url: string,
  platform: string,
  sdkVersion: string | null
): Promise<Manifest> {
  const headers = {
    'Exponent-Platform': platform,
    Accept: 'application/expo+json,application/json',
  };
  if (sdkVersion) {
    headers['Exponent-SDK-Version'] = sdkVersion;
  }
  return await ExponentTools.getManifestAsync(url, headers, {
    logger: {
      log: () => {},
      error: () => {},
      info: () => {},
    },
  });
}

async function getSavedDevHomeUrlAsync(): Promise<string> {
  const devHomeConfig = await new JsonFile(path.join(EXPO_DIR, 'dev-home-config.json')).readAsync();
  return devHomeConfig.url as string;
}

function kernelManifestObjectToJson(manifest) {
  if (!manifest.id) {
    // hack for now because unsigned manifest won't have an id
    manifest.id = '@exponent/home';
  }
  manifest.sdkVersion = 'UNVERSIONED';
  return JSON.stringify(manifest);
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
    let manifest, savedDevHomeUrl;
    try {
      savedDevHomeUrl = await getSavedDevHomeUrlAsync();
      const sdkVersion = await this.TEMPORARY_SDK_VERSION();

      manifest = await getManifestAsync(savedDevHomeUrl, platform, sdkVersion);
    } catch (e) {
      const msg = `Unable to download manifest from ${savedDevHomeUrl}: ${e.message}`;
      console[isTurtle ? 'debug' : 'error'](msg);
      return '';
    }

    return kernelManifestObjectToJson(manifest);
  },

  async DOGFOODING_PUBLISHED_KERNEL_MANIFEST(platform) {
    let manifest: Manifest;
    try {
      const sdkVersion = await this.TEMPORARY_SDK_VERSION();
      manifest = await getManifestAsync(dogfoodingHomeUrl, platform, sdkVersion);
    } catch (e) {
      const msg = `Unable to download manifest from ${dogfoodingHomeUrl}: ${e.message}`;
      console[isTurtle ? 'debug' : 'error'](msg);
      return '';
    }

    return kernelManifestObjectToJson(manifest);
  },

  async BUILD_MACHINE_KERNEL_MANIFEST(platform) {
    if (process.env.SHELL_APP_BUILDER) {
      return '';
    }

    if (process.env.CI) {
      console.log('Skip fetching local manifest on CI.');
      return '';
    }

    const pathToHome = 'home';
    const url = await UrlUtils.constructManifestUrlAsync(path.join(EXPO_DIR, pathToHome));

    try {
      const manifest = await getManifestAsync(url, platform, null);

      if (manifest.extra?.expoClient?.name !== 'expo-home') {
        console.log(
          `Manifest at ${url} is not expo-home; using published kernel manifest instead...`
        );
        return '';
      }
      return kernelManifestObjectToJson(manifest);
    } catch {
      console.error(
        chalk.red(
          `Unable to generate manifest from ${chalk.cyan(
            pathToHome
          )}: Failed to fetch manifest from ${chalk.cyan(url)}`
        )
      );
      return '';
    }
  },

  async TEMPORARY_SDK_VERSION(): Promise<string> {
    return await getHomeSDKVersionAsync();
  },

  INITIAL_URL() {
    return null;
  },
};
