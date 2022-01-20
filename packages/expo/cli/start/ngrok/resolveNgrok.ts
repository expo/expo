import * as PackageManager from '@expo/package-manager';
import chalk from 'chalk';
import resolveFrom from 'resolve-from';
import semver from 'semver';

import * as Log from '../../log';
import { delayAsync } from '../../utils/delay';
import { EXPO_DEBUG } from '../../utils/env';
import { confirmAsync } from '../../utils/prompts';

// @ts-ignore
const NGROK_REQUIRED_VERSION = '^4.1.0';
let _ngrokInstance: any | null = null;

export interface NgrokOptions {
  authtoken?: string;
  port?: string | number | null;
  host?: string;
  httpauth?: string;
  region?: string;
  configPath?: string;

  proto?: 'http' | 'tcp' | 'tls';
  addr?: string;
  inspect?: boolean;
  auth?: string;
  host_header?: string;
  bind_tls?: true | false | 'both';
  subdomain?: string;
  hostname?: string;
  crt?: string;
  key?: string;
  client_cas?: string;
  remote_addr?: string;
}

export async function resolveNgrokAsync(
  projectRoot: string,
  {
    shouldPrompt = true,
    autoInstall = false,
  }: { shouldPrompt?: boolean; autoInstall?: boolean } = {}
): Promise<any> {
  const ngrok = await findNgrokBinAsync(projectRoot);

  if (!ngrok) {
    const packageName = `@expo/ngrok@${NGROK_REQUIRED_VERSION}`;
    if (shouldPrompt) {
      if (!autoInstall) {
        // Delay the prompt so it doesn't conflict with other dev tool logs
        await delayAsync(100);
      }
      const answer =
        autoInstall ||
        (await confirmAsync({
          message: `The package ${packageName} is required to use tunnels, would you like to install it globally?`,
          initial: true,
        }));
      if (answer) {
        Log.log(`Installing ${packageName} for ${chalk.bold`tunnel`} support...`);

        const packageManager = PackageManager.createForProject(projectRoot, {
          silent: !EXPO_DEBUG,
        });

        try {
          await packageManager.addGlobalAsync(packageName);
          Log.log(`Successfully installed ${packageName}`);
        } catch (e) {
          e.message = `Failed to install ${packageName} globally: ${e.message}`;
          throw e;
        }
        return await resolveNgrokAsync(projectRoot, { shouldPrompt: false });
      }
    }
    throw new Error(
      `Please install ${packageName} and try again, or try using another hosting method like lan or localhost`
    );
  }
  return ngrok;
}

// Resolve a copy that's installed in the project.
async function resolvePackageFromProjectAsync(projectRoot: string) {
  try {
    const ngrokPackagePath = resolveFrom(projectRoot, '@expo/ngrok/package.json');
    const pkg = require(ngrokPackagePath);
    if (pkg && semver.satisfies(pkg.version, NGROK_REQUIRED_VERSION)) {
      const ngrokPath = resolveFrom(projectRoot, '@expo/ngrok');
      Log.debug(`Resolving @expo/ngrok from project: "${ngrokPath}"`);
      return require(ngrokPath);
    }
  } catch {}
  return null;
}

// Resolve a copy that's installed globally.
async function resolveGlobalPackageAsync() {
  const requireg = await import('requireg').then((module) => module.default);
  try {
    // use true to disable the use of local packages.
    const pkg = requireg('@expo/ngrok/package.json', true);
    if (semver.satisfies(pkg.version, NGROK_REQUIRED_VERSION)) {
      Log.debug(`Resolving global @expo/ngrok from: "${requireg.resolve('@expo/ngrok')}"`);
      return requireg('@expo/ngrok', true);
    }
  } catch {}

  return null;
}

async function findNgrokBinAsync(projectRoot: string): Promise<any> {
  if (_ngrokInstance) {
    return _ngrokInstance;
  }

  const localInstance = await resolvePackageFromProjectAsync(projectRoot);
  if (localInstance) {
    _ngrokInstance = localInstance;
    return _ngrokInstance;
  }

  const globalInstance = await resolveGlobalPackageAsync();
  if (globalInstance) {
    _ngrokInstance = globalInstance;
    return _ngrokInstance;
  }

  return null;
}
