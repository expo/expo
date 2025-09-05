/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { ExpoConfig, modifyConfigAsync, PackageJSONConfig } from '@expo/config';
import path from 'path';

import { MetroBundlerDevServer } from '../../start/server/metro/MetroBundlerDevServer';
import { removeAsync } from '../../utils/dir';
import { env } from '../../utils/env';
import {
  getServerDeploymentScript,
  runServerDeployCommandAsync,
  saveDeploymentUrlToTmpConfigPath,
} from '../deployServer';
import { exportApiRoutesStandaloneAsync } from '../exportStaticAsync';
import { copyPublicFolderAsync } from '../publicFolder';
import { ExportAssetMap, persistMetroFilesAsync } from '../saveAssets';
import { Options } from './resolveOptions';
import { isExecutingFromXcodebuild, logInXcode, warnInXcode } from '../xcodeCompilerLogger';

const debug = require('debug')('expo:export:server');

export async function exportStandaloneServerAsync(
  projectRoot: string,
  devServer: MetroBundlerDevServer,
  {
    exp,
    pkg,
    files,
    options,
  }: { exp: ExpoConfig; pkg: PackageJSONConfig; files: ExportAssetMap; options: Options }
) {
  if (!options.eager) {
    await tryRemovingGeneratedOriginAsync(projectRoot, exp);
  }

  logInXcode('Exporting server');

  // Store the server output in the project's .expo directory.
  const serverOutput = path.join(projectRoot, '.expo/server', options.platform);

  // Remove the previous server output to prevent stale files.
  await removeAsync(serverOutput);

  // Export the API routes for server rendering the React Server Components.
  await exportApiRoutesStandaloneAsync(devServer, {
    files,
    platform: 'web',
    apiRoutesOnly: true,
  });

  const publicPath = path.resolve(projectRoot, env.EXPO_PUBLIC_FOLDER);

  // Copy over public folder items
  await copyPublicFolderAsync(publicPath, serverOutput);

  // Copy over the server output on top of the public folder.
  await persistMetroFilesAsync(files, serverOutput);

  [...files.entries()].forEach(([key, value]) => {
    if (value.targetDomain === 'server') {
      // Delete server resources to prevent them from being exposed in the binary.
      files.delete(key);
    }
  });

  // TODO: Deprecate this in favor of a built-in prop that users should avoid setting.
  const userDefinedServerUrl = exp.extra?.router?.origin;

  const shouldSkipServerDeployment = (() => {
    if (!options.eager) {
      logInXcode('Skipping server deployment because the script is not running in eager mode.');
      return true;
    }

    // Add an opaque flag to disable server deployment.
    if (env.EXPO_NO_DEPLOY) {
      warnInXcode('Skipping server deployment because environment variable EXPO_NO_DEPLOY is set.');
      return true;
    }

    // Can't safely deploy from Xcode since the PATH isn't set up correctly. We could amend this in the future and allow users who customize the PATH to deploy from Xcode.
    if (isExecutingFromXcodebuild()) {
      // TODO: Don't warn when the eager bundle has been run.
      warnInXcode(
        'Skipping server deployment because the build is running from an Xcode run script. Build with Expo CLI or EAS Build to deploy the server automatically.'
      );
      return true;
    }

    return false;
  })();

  // Deploy the server output to a hosting provider.
  const deployedServerUrl = shouldSkipServerDeployment
    ? false
    : await runServerDeployCommandAsync(projectRoot, {
        distDirectory: serverOutput,
        deployScript: getServerDeploymentScript(pkg.scripts),
      });

  saveDeploymentUrlToTmpConfigPath({
    projectRoot,
    userDefinedServerUrl,
    deployedServerUrl,
  });
}

/** We can try to remove the generated origin from the manifest when running outside of eager mode. Bundling is the last operation to run so the config will already be embedded with the origin. */
async function tryRemovingGeneratedOriginAsync(projectRoot: string, exp: ExpoConfig) {
  if (env.CI) {
    // Skip in CI since nothing is committed.
    return;
  }
  if (exp.extra?.router?.generatedOrigin == null) {
    debug('No generated origin needs removing');
    return;
  }

  const modification = await modifyConfigAsync(
    projectRoot,
    {
      extra: {
        ...(exp.extra ?? {}),
        router: {
          ...(exp.extra?.router ?? {}),
          generatedOrigin: undefined,
        },
      },
    },
    {
      skipSDKVersionRequirement: true,
    }
  );

  if (modification.type !== 'success') {
    debug('Could not remove generated origin from manifest');
  } else {
    debug('Generated origin has been removed from manifest');
  }
}
