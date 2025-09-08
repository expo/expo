import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import fs from 'fs';
import { string } from 'getenv';
import { execSync } from 'node:child_process';
import path from 'path';

import { logInXcode, logMetroErrorInXcode, warnInXcode } from './xcodeCompilerLogger';
import { disableNetwork } from '../api/settings';
import { Log } from '../log';
import { isSpawnResultError } from '../start/platforms/ios/xcrun';
import { env } from '../utils/env';

const debug = require('debug')('expo:export:server');

export async function runServerDeployCommandAsync(
  projectRoot: string,
  {
    distDirectory,
    deployScript,
  }: { distDirectory: string; deployScript: { scriptName: string; script: string } | null }
): Promise<string | false> {
  const logOfflineError = () => {
    const manualScript = deployScript
      ? `npm run ${deployScript.scriptName}`
      : `npx eas-cli@latest deploy --export-dir ${distDirectory}`;

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
  if (!env.EXPO_UNSTABLE_DEPLOY_SERVER) {
    return false;
  }

  if (!env.EAS_BUILD && !env.__EAS_BIN) {
    // We only need to run it when building outside of EAS and EAS_BIN isn't set.
    // This check helps avoid running EAS if the user isn't a user of EAS.
    const globalBin = getCommandBin('eas');
    if (!globalBin) {
      // This should never happen from EAS Builds.
      // Possible to happen when building locally with `npx expo run`
      logMetroErrorInXcode(
        projectRoot,
        `eas-cli is not installed globally, skipping server deployment. Install EAS CLI with 'npm install -g eas-cli@latest'.`
      );
      return false;
    }
    debug('Found eas-cli:', globalBin);
  }

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

      const args = ['deploy', '--non-interactive', '--json', `--export-dir=${exportDir}`];
      if (env.__EAS_BIN) {
        results = await spawnAsync(env.__EAS_BIN, args, spawnOptions);
      } else {
        results = await spawnAsync('eas', args, spawnOptions);
      }

      debug('Server deployment stdout:', results.stdout);

      // stdout is parsed as JSON
      if (results.stderr) {
        // send stderr to stdout if the command succeeded
        // this avoids unexpected err output in eas update
        if (results.status === 0) {
          process.stdout.write(results.stderr);
        } else {
          process.stderr.write(results.stderr);
        }
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

export function getServerDeploymentScript(
  scripts: Record<string, string> | undefined
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

function canParseURL(url: string): boolean {
  try {
    // eslint-disable-next-line no-new
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function assertDeploymentJsonOutput(json: any): asserts json is {
  url: string;
  dashboardUrl?: string;
} {
  if (!json || typeof json !== 'object' || typeof json.url !== 'string') {
    throw new Error(
      'JSON output of server deployment command are not in the expected format: { url: "https://..." }'
    );
  }
}

export function saveDeploymentUrlToTmpConfigPath({
  deployedServerUrl,
  userDefinedServerUrl,
}: {
  deployedServerUrl: string | false;
  userDefinedServerUrl: string | null;
}) {
  if (deployedServerUrl && userDefinedServerUrl == null) {
    const generatedConfigPath = string('__EXPO_GENERATED_CONFIG_PATH', '');
    if (generatedConfigPath) {
      let generatedConfig: Record<string, unknown> = {};
      try {
        const rawGeneratedConfig = fs.readFileSync(generatedConfigPath, 'utf8');
        generatedConfig = JSON.parse(rawGeneratedConfig);
      } catch {}

      generatedConfig['expo.extra.router.generatedOrigin'] = deployedServerUrl;
      try {
        fs.writeFileSync(generatedConfigPath, JSON.stringify(generatedConfig), 'utf8');
        Log.log(`Using deployed server URL: ${deployedServerUrl}`);
      } catch (error) {
        Log.error('Failed to save deployed URL.');
        debug(error);
      }
    } else {
      debug('No generated config found');
    }
  } else if (deployedServerUrl && userDefinedServerUrl) {
    Log.log(
      `Using custom server URL: ${userDefinedServerUrl} (ignoring deployment URL: ${deployedServerUrl})`
    );
  }
}
