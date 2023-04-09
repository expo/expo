import { getConfig, getProjectConfigDescriptionWithPaths } from '@expo/config';
import { getEntitlementsPath } from '@expo/config-plugins/build/ios/Entitlements';
import { unquote } from '@expo/config-plugins/build/ios/utils/Xcodeproj';
import plist from '@expo/plist';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

import { Log } from '../../../../log';
import { getCodeSigningInfoForPbxproj } from '../../../../run/ios/codeSigning/xcodeCodeSigning';
import { env } from '../../../../utils/env';
import { CommandError } from '../../../../utils/errors';
import { memoize } from '../../../../utils/fn';
import { profile } from '../../../../utils/profile';
import { AppSiteAssociation, Detail } from './aasa.types';

const debug = require('debug')('expo:aasa') as typeof console.log;

/** @returns the file system path for a user-defined apple app site association file in the public folder. */
export function getUserDefinedAasaFile(projectRoot: string): string | null {
  const publicPath = path.join(projectRoot, env.EXPO_PUBLIC_FOLDER);

  for (const possiblePath of [
    './apple-app-site-association',
    './.well-known/apple-app-site-association',
  ]) {
    const fullPath = path.join(publicPath, possiblePath);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }

  return null;
}

function guessAppCredentials(projectRoot: string) {
  const bundleIdentifier = getConfig(projectRoot).exp.ios?.bundleIdentifier;
  const appleTeamId = process.env.EXPO_APPLE_TEAM_ID;
  if (!bundleIdentifier || !appleTeamId) {
    return null;
  }
  return {
    bundleIdentifier,
    appleTeamId,
  };
}

export function generateAasaForProject(projectRoot: string): AppSiteAssociation | null {
  // We currently get the bundle identifier and Apple Team ID from the pbxproj file.
  if (!fs.existsSync(path.join(projectRoot, 'ios'))) {
    const possibleCredentials = guessAppCredentials(projectRoot);
    if (possibleCredentials) {
      const aasa = generateAasaJson(projectRoot, possibleCredentials);
      if (!aasa) {
        debug('No valid Apple App Site Association file could be generated, skipping.');
      }
      return aasa ?? null;
    }
    debug('No iOS project found, skipping Apple App Site Association file');
    maybeWarnAasaCouldNotBeGenerated(projectRoot);
    return null;
  }
  // Check if the project has a valid iOS bundle identifier
  const info = getCodeSigningInfoForPbxproj(projectRoot);
  debug('Checking info', info);
  const firstValid = Object.values(info).find(
    (i) => i.bundleIdentifiers.length && i.developmentTeams.length
  );

  if (!firstValid) {
    debug(
      'No valid iOS bundle identifier or Apple Team ID found for a single target in the Xcode project, skipping Apple App Site Association file.'
    );
    maybeWarnAasaCouldNotBeGenerated(projectRoot);
    return null;
  }

  const aasa = generateAasaJson(projectRoot, {
    // TODO: Drop unquote if/when we migrate to xcparse.
    bundleIdentifier: unquote(firstValid.bundleIdentifiers[0]),
    appleTeamId: unquote(firstValid.developmentTeams[0]),
  });
  if (!aasa) {
    debug('No valid Apple App Site Association file could be generated, skipping.');
  }
  return aasa ?? null;
}

/** Will format nicely if possible, minified if too large, and assert if the file is simply too big. */
export function getOptimallyFormattedString(json: any): string {
  let results = JSON.stringify(json, null, 2);

  if (isStringTooLarge(results)) {
    // If the string is too large, then we should try to remove the whitespace.
    results = JSON.stringify(json);

    if (isStringTooLarge(results)) {
      throw new CommandError(
        'APPLE_APP_SITE_ASSOCIATION_TOO_LARGE',
        'The apple app site association file is over 128kb which is too large.'
      );
    }
  }

  return results;
}

function isStringTooLarge(str: string): boolean {
  // If the string is over 128kb, then Apple won't parse it.
  return Buffer.byteLength(str, 'utf8') > 128 * 1024;
}

function getAppLinkDetails(id: string): Detail {
  return {
    appIDs: [id],
    components: [
      // TODO(EvanBacon): All routes in Expo Router should be able to export some static settings
      // indicating that a route should be excluded from the AASA file.
      // We will need to support this here as an extension to our SSG support.
      {
        '/': '*',
        comment: 'Matches all routes',
      },
    ],
  };
}

function getEntitlements(projectRoot: string) {
  const entitlementsPath = getEntitlementsPath(projectRoot);
  if (!entitlementsPath || !fs.existsSync(entitlementsPath)) {
    return null;
  }

  const entitlementsContents = fs.readFileSync(entitlementsPath, 'utf8');
  return plist.parse(entitlementsContents);
}

const maybeWarnAasaCouldNotBeGenerated = memoize((projectRoot: string) => {
  const config = getConfig(projectRoot);
  if (config.exp?.ios?.associatedDomains?.length) {
    const configName = getProjectConfigDescriptionWithPaths(projectRoot, config);
    Log.warn(
      chalk`Skipping auto Apple App Site Association (web): Local {bold ios} directory is either not present, is missing the Apple Team ID, or has no {bold com.apple.developer.associated-domains} entitlements. Alternatively, you can create a ${chalk.bold(
        path.join(env.EXPO_PUBLIC_FOLDER, '.well-known/apple-app-site-association')
      )} file manually, or remove the {bold ios.associatedDomains} from the project ${chalk.bold(
        configName
      )} file to disable universal link support on iOS. {gray Feature can also be disabled with $EXPO_NO_APPLE_APP_SITE_ASSOCIATION=1}`
    );
  }
});

// TODO: Figure out if this is useful
async function introspectEntitlementsAsync(projectRoot: string) {
  const { getPrebuildConfigAsync } = require('@expo/prebuild-config');
  const { compileModsAsync } = require('@expo/config-plugins/build/plugins/mod-compiler');

  const config = await profile(getPrebuildConfigAsync)(projectRoot, {
    platforms: ['ios'],
  });

  await compileModsAsync(config.exp, {
    projectRoot,
    introspect: true,
    platforms: ['ios'],
    assertMissingModProviders: false,
  });
  // @ts-ignore
  delete config.modRequest;
  // @ts-ignore
  delete config.modResults;
  console.log('Entitlements:', config);
}

function generateAasaJson(
  projectRoot: string,
  { bundleIdentifier, appleTeamId }: { bundleIdentifier: string; appleTeamId: string }
) {
  const aasaAppID = [appleTeamId, bundleIdentifier].join('.');

  introspectEntitlementsAsync(projectRoot);
  const entitlements = getEntitlements(projectRoot);
  const associatedDomains = entitlements?.['com.apple.developer.associated-domains'];
  // Only generate the web verification file if the native verification is setup.
  if (!associatedDomains) {
    debug('No associated domains found in entitlements, skipping Apple App Site Association file');
    maybeWarnAasaCouldNotBeGenerated(projectRoot);
    return null;
  }

  const supportedFields = ['activitycontinuation', 'applinks', 'webcredentials'].filter((field) =>
    associatedDomains.some((domain: string) => domain.startsWith(`${field}:`))
  );

  if (!supportedFields.length) {
    debug('No supported fields found in entitlements associated domains');
    maybeWarnAasaCouldNotBeGenerated(projectRoot);
    return null;
  }

  const aasa: AppSiteAssociation = {
    // TODO: App Clips?
  };

  if (supportedFields.includes('applinks')) {
    aasa.applinks = {
      details: [getAppLinkDetails(aasaAppID)],
    };
  }

  if (supportedFields.includes('activitycontinuation')) {
    aasa.activitycontinuation = {
      apps: [aasaAppID],
    };
  }

  if (supportedFields.includes('webcredentials')) {
    aasa.webcredentials = {
      apps: [aasaAppID],
    };
  }

  return aasa;
}

export function exportAppleAppSiteAssociationAsync(projectRoot: string, distRoot: string): boolean {
  if (getUserDefinedAasaFile(projectRoot)) {
    debug('User defined Apple App Site Association file found, skipping.');
    return false;
  }

  const aasa = generateAasaForProject(projectRoot);
  if (!aasa) {
    return false;
  }

  if (env.EXPO_NO_APPLE_APP_SITE_ASSOCIATION) {
    Log.log(
      chalk.gray`Skipping Apple App Site Association generation because EXPO_NO_APPLE_APP_SITE_ASSOCIATION is set.`
    );
    return false;
  }

  const parsedResults = getOptimallyFormattedString(aasa);

  const aasaPath = path.join(distRoot, './.well-known/apple-app-site-association');
  fs.mkdirSync(path.dirname(aasaPath), { recursive: true });
  fs.writeFileSync(aasaPath, parsedResults);
  Log.log('Configured universal Apple links');
  debug('Wrote Apple App Site Association file to', aasaPath);
  return true;
}
