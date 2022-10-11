import { getEntitlementsPath } from '@expo/config-plugins/build/ios/Entitlements';
import { unquote } from '@expo/config-plugins/build/ios/utils/Xcodeproj';
import plist from '@expo/plist';
import fs from 'fs';
import path from 'path';
import { parse } from 'url';

import { getCodeSigningInfoForPbxproj } from '../../../run/ios/codeSigning/xcodeCodeSigning';
import { env } from '../../../utils/env';
import { AppSiteAssociation, Detail } from './aasa.types';
import { ExpoMiddleware } from './ExpoMiddleware';
import { ServerNext, ServerRequest, ServerResponse } from './server.types';
import { streamStaticFileResponse } from './ServeStaticMiddleware';

const debug = require('debug')('expo:start:server:middleware:aasa') as typeof console.log;

export type TouchFileBody = { path: string; contents: string };

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

    // We currently get the bundle identifier and Apple Team ID from the pbxproj file.
    if (!fs.existsSync(path.join(this.projectRoot, 'ios'))) {
      debug('No iOS project found, skipping Apple App Site Association file');
      return next();
    }

    try {
      // Check if the project has a valid iOS bundle identifier
      const info = getCodeSigningInfoForPbxproj(this.projectRoot);
      debug('Checking info', info);
      const firstValid = Object.values(info).find(
        (i) => i.bundleIdentifiers.length && i.developmentTeams.length
      );

      if (!firstValid) {
        debug(
          'No valid iOS bundle identifier or Apple Team ID found for a single target in the Xcode project, skipping Apple App Site Association file.'
        );
        return next();
      }

      const aasa = generateAasaJson(this.projectRoot, {
        // TODO: Drop unquote if/when we migrate to xcparse.
        bundleIdentifier: unquote(firstValid.bundleIdentifiers[0]),
        appleTeamId: unquote(firstValid.developmentTeams[0]),
      });

      if (!aasa) {
        debug('No valid Apple App Site Association file could be generated, skipping.');
        return next();
      }

      const parsedResults = JSON.stringify(aasa, null, 2);

      debug('Generated valid Apple App Site Association file:\n', parsedResults);
      // Respond with the generated Apple App Site Association file as json
      res.setHeader('Content-Type', 'application/json');
      res.end(parsedResults);
    } catch (e) {
      debug('No valid iOS bundle identifier found');
      // TODO: Maybe reject so it's easier to tell what happened?
      return next();
    }
  }
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

function generateAasaJson(
  projectRoot: string,
  { bundleIdentifier, appleTeamId }: { bundleIdentifier: string; appleTeamId: string }
) {
  const aasaAppID = [appleTeamId, bundleIdentifier].join('.');

  const entitlements = getEntitlements(projectRoot);
  const associatedDomains = entitlements?.['com.apple.developer.associated-domains'];
  // Only generate the web verification file if the native verification is setup.
  if (!associatedDomains) {
    return null;
  }
  const supportedFields = ['activitycontinuation', 'applinks', 'webcredentials'].filter((field) => {
    return associatedDomains.some((domain: string) => {
      return domain.startsWith(`${field}:`);
    });
  });

  if (!supportedFields.length) {
    debug('No supported fields found in entitlements associated domains');
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
