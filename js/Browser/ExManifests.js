/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule ExManifests
 */
'use strict';

import {
  NativeModules,
  Platform,
} from 'react-native';

import ExUrls from 'ExUrls';
import ExponentKernel from 'ExponentKernel';
import url from 'url';

const ANONYMOUS_EXPERIENCE_ID_PREFIX = '@anonymous/';

let ExManifests = {
  async manifestUrlToBundleUrlAndManifestAsync(manifestUrl) {
    if (Platform.OS !== 'ios') {
      throw new Error('This method is only supported on iOS');
    }
    let httpManifestUrl = ExUrls.toHttp(manifestUrl);
    let httpManifestUrlComponents = url.parse(httpManifestUrl);
    // Append index.exp to path
    if (!httpManifestUrlComponents.pathname) {
      httpManifestUrlComponents.pathname = '';
    }
    let indexOfDeepLink = httpManifestUrlComponents.pathname.indexOf('+');
    if (indexOfDeepLink !== -1) {
      httpManifestUrlComponents.pathname = httpManifestUrlComponents.pathname.substring(0, indexOfDeepLink);
    }
    if (!httpManifestUrlComponents.pathname.endsWith('/')) {
      httpManifestUrlComponents.pathname += '/';
    }
    httpManifestUrlComponents.pathname += 'index.exp';
    httpManifestUrl = url.format(httpManifestUrlComponents);

    // Fetch manifest
    let manifestString;
    try {
      manifestString = await ExponentKernel.getManifestAsync(httpManifestUrl, manifestUrl);
    } catch (e) {
      e.message = `Error while loading: ${e.message}.`;
      throw e;
    }

    // Parse JSON
    let manifest;
    try {
      manifest = JSON.parse(manifestString);
    } catch (error) {
      // manifestUrl didn't return a manifest. Try using manifestUrl as the bundleUrl.
      return {
        bundleUrl: manifestUrl,
        manifest: {},
      };
    }

    // disregard manifest verification for anonymous experiences
    if (manifest.id && manifest.id.indexOf(ANONYMOUS_EXPERIENCE_ID_PREFIX) === 0) {
      manifest.isVerified = true;
    }

    if (!manifest.isVerified) {
      throw new Error('This experience could not be verified.');
    }
    if (!manifest.bundleUrl) {
      throw new Error('No bundleUrl in manifest.');
    }

    return {
      // TODO: remove url.resolve and only use manifest.bundleUrl
      bundleUrl: url.resolve(httpManifestUrl, manifest.bundleUrl),
      manifest,
    };
  },

  getFramePropsFromManifest(manifest, bundleUrl) {
    let source = ExUrls.toHttp(bundleUrl);
    let { query } = url.parse(source, true);
    let appKey = manifest.appKey || query.app || 'main';

    let debuggerHost = manifest.debuggerHost;
    let debuggerHostname = debuggerHost ? ExUrls.getHostnameForHost(debuggerHost) :
      null;
    let debuggerPort = debuggerHost ? Number(ExUrls.getPortForHost(debuggerHost)) :
      -1;

    return { source, appKey, debuggerHostname, debuggerPort };
  },

  isManifestSdkVersionSupported(manifest) {
    let sdkVersion = manifest.sdkVersion;
    if (sdkVersion === 'UNVERSIONED') {
      return true; // you're on your own, buddy!
    }

    let supportedVersions = ExponentKernel.sdkVersions;
    let sdkVersionComponents;
    let isManifestSdkVersionSupported = false;

    try {
      sdkVersionComponents = sdkVersion.split('.').map(component => parseInt(component, 10));
    } catch (_) {}

    supportedVersions.forEach(supportedVersion => {
      if (supportedVersion === sdkVersion) {
        isManifestSdkVersionSupported = true;
      }
      try {
        let supportedVersionComponents = supportedVersion.split('.').map(component => parseInt(component, 10));
        if (sdkVersionComponents[0] === supportedVersionComponents[0] && sdkVersionComponents[1] === supportedVersionComponents[1]) {
          isManifestSdkVersionSupported = true;
        }
      } catch (_) {}
    });
    return isManifestSdkVersionSupported;
  },
};

export default ExManifests;
