import { getConfig, getProjectConfigDescriptionWithPaths } from '@expo/config';
import { getEntitlementsPath } from '@expo/config-plugins/build/ios/Entitlements';
import { unquote } from '@expo/config-plugins/build/ios/utils/Xcodeproj';
import plist from '@expo/plist';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { parse } from 'url';

import { Log } from '../../../log';
import { getCodeSigningInfoForPbxproj } from '../../../run/ios/codeSigning/xcodeCodeSigning';
import { env } from '../../../utils/env';
import { CommandError } from '../../../utils/errors';
import { memoize } from '../../../utils/fn';
import { ExpoMiddleware } from './ExpoMiddleware';
import { streamStaticFileResponse } from './ServeStaticMiddleware';
import { AppSiteAssociation, Detail } from './aasa.types';
import { ServerNext, ServerRequest, ServerResponse } from './server.types';

const debug = require('debug')('expo:start:server:middleware:aasa') as typeof console.log;

/**
 * Middleware for generating an Apple App Site Association file for the current project.
 *
 * Test by making a get request with:
 * curl -v http://localhost:19000/apple-app-site-association
 */
export class AppleAppSiteAssociationMiddleware extends ExpoMiddleware {
  constructor(protected projectRoot: string) {
    super(projectRoot, ['/apple-app-site-association', '/.well-known/apple-app-site-association']);
  }

  async handleRequestAsync(
    req: ServerRequest,
    res: ServerResponse,
    next: ServerNext
  ): Promise<void> {
    if (!req?.url || (req.method !== 'GET' && req.method !== 'HEAD')) {
      return next();
    }

    const pathname = parse(req.url).pathname;
    if (!pathname) {
      return next();
    }
    const publicPath = path.join(this.projectRoot, env.EXPO_PUBLIC_FOLDER);

    // If any apple-app-site-association file exists in the public folder, serve that instead.
    if (pathname.includes('.well-known')) {
      if (fs.existsSync(path.join(publicPath, 'apple-app-site-association'))) {
        streamStaticFileResponse(
          '/apple-app-site-association',
          { root: publicPath },
          req,
          res,
          next
        );
        return;
      }
    } else {
      if (fs.existsSync(path.join(publicPath, './.well-known/apple-app-site-association'))) {
        streamStaticFileResponse(
          '/.well-known/apple-app-site-association',
          { root: publicPath },
          req,
          res,
          next
        );
        return;
      }
    }

    const aasa = generateAasaForProject(this.projectRoot);
    if (!aasa) {
      return next();
    }

    const parsedResults = getOptimallyFormattedString(aasa);

    debug('Generated valid Apple App Site Association file:\n', parsedResults);
    // Respond with the generated Apple App Site Association file as json
    res.setHeader('Content-Type', 'application/json');
    res.end(parsedResults);
  }
}

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
      return generateAasaAndFormat(projectRoot, possibleCredentials);
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

  return generateAasaAndFormat(projectRoot, {
    // TODO: Drop unquote if/when we migrate to xcparse.
    bundleIdentifier: unquote(firstValid.bundleIdentifiers[0]),
    appleTeamId: unquote(firstValid.developmentTeams[0]),
  });
}

function generateAasaAndFormat(
  projectRoot: string,
  props: { bundleIdentifier: string; appleTeamId: string }
) {
  const aasa = generateAasaJson(projectRoot, props);

  if (!aasa) {
    debug('No valid Apple App Site Association file could be generated, skipping.');
    return null;
  }

  const parsedResults = getOptimallyFormattedString(aasa);

  debug('Generated valid Apple App Site Association file:\n', parsedResults);

  return aasa;
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
      // indicating that a route should be excluded from the AASA file. We will need to support this here.
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
  const entitlements = plist.parse(entitlementsContents);
  return entitlements;
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
      )} file to disable universal link support on iOS.`
    );
  }
});

function generateAasaJson(
  projectRoot: string,
  { bundleIdentifier, appleTeamId }: { bundleIdentifier: string; appleTeamId: string }
) {
  const aasaAppID = [appleTeamId, bundleIdentifier].join('.');

  const entitlements = getEntitlements(projectRoot);
  const associatedDomains = entitlements?.['com.apple.developer.associated-domains'];
  // Only generate the web verification file if the native verification is setup.
  if (!associatedDomains) {
    debug('No associated domains found in entitlements, skipping Apple App Site Association file');
    maybeWarnAasaCouldNotBeGenerated(projectRoot);
    return null;
  }
  const supportedFields = ['activitycontinuation', 'applinks', 'webcredentials'].filter((field) => {
    return associatedDomains.some((domain: string) => {
      return domain.startsWith(`${field}:`);
    });
  });

  if (!supportedFields.length) {
    debug('No supported fields found in entitlements associated domains');
    maybeWarnAasaCouldNotBeGenerated(projectRoot);
    return null;
  }

  const aasa: AppSiteAssociation = {
    // appclips: {
    //   apps: [aasaAppID + '.Clip'],
    // },
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

export function ensureAasaWritten(projectRoot: string, distRoot: string): boolean {
  if (getUserDefinedAasaFile(projectRoot)) {
    debug('User defined Apple App Site Association file found, skipping.');
    return false;
  }

  const aasa = generateAasaForProject(projectRoot);
  if (!aasa) {
    return false;
  }

  const parsedResults = getOptimallyFormattedString(aasa);

  const aasaPath = path.join(distRoot, './.well-known/apple-app-site-association');
  fs.mkdirSync(path.dirname(aasaPath), { recursive: true });
  fs.writeFileSync(aasaPath, parsedResults);
  Log.log('Set up Apple universal links');
  debug('Wrote Apple App Site Association file to', aasaPath);
  return true;
}
