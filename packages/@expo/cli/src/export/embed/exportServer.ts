/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { ExpoConfig, modifyConfigAsync, PackageJSONConfig } from '@expo/config';
import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import fs from 'fs';
import { execSync } from 'node:child_process';
import path from 'path';

import { disableNetwork } from '../../api/settings';
import { Log } from '../../log';
import { isSpawnResultError } from '../../start/platforms/ios/xcrun';
import { MetroBundlerDevServer } from '../../start/server/metro/MetroBundlerDevServer';
import { removeAsync } from '../../utils/dir';
import { env } from '../../utils/env';
import { CommandError } from '../../utils/errors';
import { exportApiRoutesStandaloneAsync } from '../exportStaticAsync';
import { copyPublicFolderAsync } from '../publicFolder';
import { ExportAssetMap, persistMetroFilesAsync } from '../saveAssets';
import { Options } from './resolveOptions';
import {
  isExecutingFromXcodebuild,
  logInXcode,
  logMetroErrorInXcode,
  warnInXcode,
} from './xcodeCompilerLogger';

const debug = require('debug')('expo:export:server');

type ServerDeploymentResults = {
  url: string;
  dashboardUrl?: string;
};

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
  let serverUrl = userDefinedServerUrl;

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
        deployScript: getServerDeploymentScript(pkg.scripts, options.platform),
      });

  if (!deployedServerUrl) {
    return;
  }

  if (serverUrl) {
    logInXcode(
      `Using custom server URL: ${serverUrl} (ignoring deployment URL: ${deployedServerUrl})`
    );
  }

  // If the user-defined server URL is not defined, use the deployed server URL.
  // This allows for overwriting the server URL in the project's native files.
  serverUrl ||= deployedServerUrl;

  // If the user hasn't manually defined the server URL, write the deployed server URL to the app.json.
  if (userDefinedServerUrl) {
    return;
  }
  Log.log('Writing generated server URL to app.json');

  // NOTE: Is is it possible to assert that the config needs to be modifiable before building the app?
  const modification = await modifyConfigAsync(
    projectRoot,
    {
      extra: {
        ...(exp.extra ?? {}),
        router: {
          ...(exp.extra?.router ?? {}),
          generatedOrigin: serverUrl,
        },
      },
    },
    {
      skipSDKVersionRequirement: true,
    }
  );

  if (modification.type !== 'success') {
    throw new CommandError(
      `Failed to write generated server origin to app.json because the file is dynamic and does not extend the static config. The client will not be able to make server requests to API routes or static files. You can disable server linking with EXPO_NO_DEPLOY=1 or by disabling server output in the app.json.`
    );
  }
}

async function dumpDeploymentLogs(projectRoot: string, logs: string, name = 'deploy') {
  const outputPath = path.join(projectRoot, `.expo/logs/${name}.log`);
  await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
  debug('Dumping server deployment logs to: ' + outputPath);
  await fs.promises.writeFile(outputPath, logs);
  return outputPath;
}

function getCommandBin(command: string) {
  try {
    return execSync(`command -v ${command}`, { stdio: 'pipe' }).toString().trim();
  } catch {
    return null;
  }
}

async function runServerDeployCommandAsync(
  projectRoot: string,
  {
    distDirectory,
    deployScript,
  }: { distDirectory: string; deployScript: { scriptName: string; script: string } | null }
): Promise<string | false> {
  const logOfflineError = () => {
    const manualScript = deployScript
      ? `npm run ${deployScript.scriptName}`
      : `npx eas deploy --export-dir ${distDirectory}`;

    logMetroErrorInXcode(
      projectRoot,
      chalk.red`Running CLI in offline mode, skipping server deployment. Deploy manually with: ${manualScript}`
    );
  };
  if (env.EXPO_OFFLINE) {
    logOfflineError();
    return false;
  }

  // TODO: Only allow EAS deployments when staging is enabled, this is because the feature is still staging-only.
  if (!deployScript && !env.EXPO_STAGING) {
    return false;
  }

  const globalBin = getCommandBin('eas');
  if (!globalBin) {
    // This should never happen from EAS Builds.
    // Possible to happen when building locally with `npx expo run`
    logMetroErrorInXcode(
      projectRoot,
      `eas-cli is not installed globally, skipping server deployment. Install EAS CLI with 'npm install -g eas-cli'.`
    );
    return false;
  }
  debug('Found eas-cli:', globalBin);

  let json: any;
  try {
    let results: spawnAsync.SpawnResult;

    const spawnOptions: spawnAsync.SpawnOptions = {
      cwd: projectRoot,
      // Ensures that errors can be caught.
      stdio: 'pipe',
    };
    // TODO: Support absolute paths in EAS CLI
    const exportDir = path.relative(projectRoot, distDirectory);
    if (deployScript) {
      logInXcode(`Using custom server deploy script: ${deployScript.scriptName}`);
      // Amend the path to try and make the custom scripts work.

      results = await spawnAsync(
        'npm',
        ['run', deployScript.scriptName, `--export-dir=${exportDir}`],
        spawnOptions
      );
    } else {
      logInXcode('Deploying server to link with client');

      // results = DEPLOYMENT_SUCCESS_FIXTURE;
      results = await spawnAsync(
        'node',
        [globalBin, 'deploy', '--non-interactive', '--json', `--export-dir=${exportDir}`],
        spawnOptions
      );

      debug('Server deployment stdout:', results.stdout);

      // Send stderr to stderr. stdout is parsed as JSON.
      if (results.stderr) {
        process.stderr.write(results.stderr);
      }
    }

    const logPath = await dumpDeploymentLogs(projectRoot, results.output.join('\n'));

    try {
      // {
      //   "dashboardUrl": "https://staging.expo.dev/projects/6460c11c-e1bc-4084-882a-fd9f57b825b1/hosting/deployments",
      //   "identifier": "8a1pwbv6c5",
      //   "url": "https://sep30--8a1pwbv6c5.staging.expo.app"
      // }
      json = JSON.parse(results.stdout.trim());
    } catch {
      logMetroErrorInXcode(
        projectRoot,
        `Failed to parse server deployment JSON output. Check the logs for more information: ${logPath}`
      );
      return false;
    }
  } catch (error) {
    if (isSpawnResultError(error)) {
      const output = error.output.join('\n').trim() || error.toString();
      Log.log(
        chalk.dim(
          'An error occurred while deploying server. Logs stored at: ' +
            (await dumpDeploymentLogs(projectRoot, output, 'deploy-error'))
        )
      );

      // Likely a server offline or network error.
      if (output.match(/ENOTFOUND/)) {
        logOfflineError();
        // Print the raw error message to help provide more context.
        Log.log(chalk.dim(output));
        // Prevent any other network requests (unlikely for this command).
        disableNetwork();
        return false;
      }

      logInXcode(output);
      if (output.match(/spawn eas ENOENT/)) {
        // EAS not installed.
        logMetroErrorInXcode(
          projectRoot,
          `Server deployment failed because eas-cli cannot be accessed from the build script's environment (ENOENT). Install EAS CLI with 'npm install -g eas-cli'.`
        );
        return false;
      }

      if (error.stderr.match(/Must configure EAS project by running/)) {
        // EAS not configured, this can happen when building a project locally before building in EAS.
        // User must run `eas init`, `eas deploy`, or `eas build` first.

        // TODO: Should we fail the build here or just warn users?
        logMetroErrorInXcode(
          projectRoot,
          `Skipping server deployment because EAS is not configured. Run 'eas init' before trying again, or disable server output in the project.`
        );
        return false;
      }
    }

    // Throw unhandled server deployment errors.
    throw error;
  }

  // Assert json format
  assertDeploymentJsonOutput(json);

  // Warn about the URL not being valid. This should never happen, but might be possible with third-parties.
  if (!canParseURL(json.url)) {
    warnInXcode(`The server deployment URL is not a valid URL: ${json.url}`);
  }

  if (json.dashboardUrl) {
    logInXcode(`Server dashboard: ${json.dashboardUrl}`);
  }

  logInXcode(`Server deployed to: ${json.url}`);

  return json.url;
}

function canParseURL(url: string): boolean {
  try {
    // eslint-disable-next-line no-new
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function assertDeploymentJsonOutput(json: any): asserts json is ServerDeploymentResults {
  if (!json || typeof json !== 'object' || typeof json.url !== 'string') {
    throw new Error(
      'JSON output of server deployment command are not in the expected format: { url: "https://..." }'
    );
  }
}

function getServerDeploymentScript(
  scripts: Record<string, string> | undefined,
  platform: string
): { scriptName: string; script: string } | null {
  // Users can overwrite the default deployment script with:
  // { scripts: { "native:deploy": "eas deploy --json --non-interactive" } }
  // A quick search on GitHub showed that `native:deploy` is not used in any public repos yet.
  // https://github.com/search?q=%22native%3Adeploy%22+path%3Apackage.json&type=code
  const DEFAULT_SCRIPT_NAME = 'native:deploy';

  const scriptNames = [
    // DEFAULT_SCRIPT_NAME + ':' + platform,
    DEFAULT_SCRIPT_NAME,
  ];

  for (const scriptName of scriptNames) {
    if (scripts?.[scriptName]) {
      return { scriptName, script: scripts[scriptName] };
    }
  }

  return null;
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
