#!/usr/bin/env node
import chalk from 'chalk';
import { statSync } from 'fs';
import { relative } from 'path';
import prompts from 'prompts';

import * as Android from './Android';
import * as Ios from './Ios';
import { CommandError, Options } from './Options';

function fileExists(filePath: string): boolean {
  try {
    return statSync(filePath).isFile();
  } catch {
    return false;
  }
}
export function getAvailablePlatforms(
  options: Pick<Options, 'projectRoot' | 'infoPath' | 'manifestPath'>
): string[] {
  const platforms: string[] = [];
  if (options.infoPath) {
    if (!fileExists(options.infoPath)) {
      throw new CommandError(`Custom Info.plist does not exist at path "${options.infoPath}"`);
    }
    platforms.push('ios');
  } else if (Ios.isAvailable(options.projectRoot)) {
    platforms.push('ios');
  }
  if (options.manifestPath) {
    if (!fileExists(options.manifestPath)) {
      throw new CommandError(
        `Custom AndroidManifest.xml does not exist at path "${options.manifestPath}"`
      );
    }
    platforms.push('android');
  } else if (Android.isAvailable(options.projectRoot)) {
    platforms.push('android');
  }
  return platforms;
}

/**
 * Ensure the URI scheme is a valid string.
 *
 * @param uri URI scheme prefix to validate
 */
function ensureUriString(uri: any): string {
  if (!uri) {
    throw new CommandError('Please supply a URI protocol');
  }
  if (typeof uri !== 'string') {
    throw new CommandError(`URI protocol should be of type string. Instead got: ${typeof uri}`);
  }

  return uri.trim();
}

/**
 * Normalize a URI scheme prefix according to [RFC 2396](http://www.ietf.org/rfc/rfc2396.txt).
 *
 * @param uri URI scheme prefix to validate
 */
async function normalizeUriProtocolAsync(uri: any): Promise<string> {
  const trimmedUri = ensureUriString(uri);
  const [protocol] = trimmedUri.split(':');
  const normalizedUri = protocol.toLowerCase();
  if (normalizedUri !== uri) {
    // Create a warning.
    if (normalizedUri) {
      console.log(
        chalk.yellow(
          `\u203A Supplied URI protocol "${trimmedUri}" does not match normalized scheme "${normalizedUri}".`
        )
      );
      const { answer } = await prompts({
        type: 'confirm',
        name: 'answer',
        message: `Would you like to use "${normalizedUri}" instead?`,
        initial: true,
      });
      if (answer) return normalizedUri;
    } else {
      throw new CommandError(
        `Supplied URI protocol "${trimmedUri}" does not appear to be spec compliant: http://www.ietf.org/rfc/rfc2396.txt`
      );
    }
  }
  return trimmedUri;
}

export async function addAsync(options: Options): Promise<string[]> {
  // Although schemes are case-insensitive, the canonical form is
  // lowercase and documents that specify schemes must do so with lowercase letters.
  options.uri = await normalizeUriProtocolAsync(options.uri);

  const results: string[] = [];
  let actionOccurred = false;
  if (options.ios) {
    if (await Ios.addAsync(options)) {
      actionOccurred = true;
      logPlatformMessage('iOS', `Added URI protocol "${options.uri}" to project`);
      results.push('ios');
    }
  }
  if (options.android) {
    if (await Android.addAsync(options)) {
      actionOccurred = true;
      logPlatformMessage('Android', `Added URI protocol "${options.uri}" to project`);
      results.push('android');
    }
  }

  if (!actionOccurred) {
    console.log(
      chalk.yellow(
        'No URI schemes could be added. Please ensure there is a native project available.'
      )
    );
  }

  return results;
}

export async function removeAsync(options: Options): Promise<string[]> {
  options.uri = ensureUriString(options.uri);

  const results: string[] = [];
  let actionOccurred = false;

  if (options.ios) {
    if (await Ios.removeAsync(options)) {
      actionOccurred = true;
      logPlatformMessage('iOS', `Removed URI protocol "${options.uri}" from project`);
      results.push('ios');
    }
  }
  if (options.android) {
    if (await Android.removeAsync(options)) {
      actionOccurred = true;
      logPlatformMessage('Android', `Removed URI protocol "${options.uri}" from project`);
      results.push('android');
    }
  }

  if (!actionOccurred) {
    console.log(
      chalk.yellow(
        'No URI schemes could be removed. Please ensure there is a native project available.'
      )
    );
  }
  return results;
}

export async function openAsync(
  options: Pick<Options, 'uri' | 'ios' | 'android' | 'projectRoot'> & { androidPackage?: string }
): Promise<void> {
  options.uri = ensureUriString(options.uri);

  if (options.ios) {
    logPlatformMessage('iOS', `Opening URI "${options.uri}" in simulator`);
    await Ios.openAsync(options);
  }
  if (options.android) {
    logPlatformMessage('Android', `Opening URI "${options.uri}" in emulator`);
    await Android.openAsync(options);
  }
}

export async function listAsync(
  options: Pick<Options, 'infoPath' | 'projectRoot' | 'manifestPath'>
): Promise<void> {
  let actionOccurred = false;

  if (options.infoPath) {
    actionOccurred = true;
    const schemes = await Ios.getAsync(options);
    logPlatformMessage(
      'iOS',
      `Schemes for config: ./${relative(options.projectRoot, options.infoPath)}`
    );
    logSchemes(schemes);
  }
  if (options.manifestPath) {
    actionOccurred = true;
    const schemes = await Android.getAsync(options);
    logPlatformMessage(
      'Android',
      `Schemes for config: ./${relative(options.projectRoot, options.manifestPath)}`
    );
    logSchemes(schemes);
  }

  if (!actionOccurred) {
    console.log(chalk.yellow('Could not find any native URI schemes to list.'));
  }
}

function logPlatformMessage(platform: string, message: string): void {
  console.log(chalk.magenta(`\u203A ${chalk.bold(platform)}: ${message}`));
}
function logSchemes(schemes: string[]): void {
  for (const scheme of schemes) console.log(`${chalk.dim('\u203A ')}${scheme}${chalk.dim('://')}`);
  console.log('');
}
