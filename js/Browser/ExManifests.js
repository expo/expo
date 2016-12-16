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

import ApiClient from 'ApiClient';
import Config from 'Config';
import ExUrls from 'ExUrls';
import url from 'url';

const {
  ExponentKernel,
} = NativeModules;

let ExManifests = {
  async manifestUrlToBundleUrlAndManifestAsync(manifestUrl) {
    console.log(`Begin fetching manifest for ${manifestUrl}`);
    let startTime = new Date();

    let httpManifestUrl = ExUrls.toHttp(manifestUrl);
    let isSecureDomain = httpManifestUrl.startsWith('https://exp.host');
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
    let shouldRequestSignedManifest = (Platform.OS === 'ios' || !isSecureDomain);
    let newtorkStartTime = new Date();
    let manifestString;
    if (Platform.OS === 'ios' && ExponentKernel.getManifestAsync) {
      try {
        manifestString = await ExponentKernel.getManifestAsync(httpManifestUrl, manifestUrl);
      } catch (e) {
        e.message = `Error while loading: ${e.message}.`;
        throw e;
      }
    } else {
      manifestString = await ApiClient.fetchManifestAsync(httpManifestUrl, shouldRequestSignedManifest);
    }
    let networkDuration = new Date() - newtorkStartTime;

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

    // Verify signature. If using secure domain, don't need to check signature.
    let isVerified = isSecureDomain;
    if (shouldRequestSignedManifest && manifest.manifestString && manifest.signature) {
      try {
        isVerified = await ExponentKernel.verifyPublicRSASignatureAsync(
          Config.api.host + '/--/manifest-public-key',
          manifest.manifestString,
          manifest.signature
        );
      } catch (decryptError) {
        // isVerified is already false
      }

      manifest = JSON.parse(manifest.manifestString);
    }
    manifest.isVerified = isVerified;

    // Build bundleUrl
    if (!manifest.bundleUrl) {
      throw new Error('No bundleUrl in manifest.');
    }

    let duration = new Date() - startTime;
    console.log(`Done fetching manifest for ${manifestUrl}. Took ${duration}ms. Network request took ${networkDuration}ms.`);
    return {
      // TODO: remove url.resolve and only use manifest.bundleUrl
      bundleUrl: url.resolve(httpManifestUrl, manifest.bundleUrl),
      manifest,
    };
  },

  normalizeManifest(manifestUrl, manifest) {
    return Object.assign(manifest, {
      id: manifest.id || manifestUrl,
      name: manifest.name || 'My New Experience',
      primaryColor: manifest.primaryColor || '#023C69',
      iconUrl: manifest.iconUrl || 'https://d3lwq5rlu14cro.cloudfront.net/ExponentEmptyManifest_192.png',
      orientation: manifest.orientation || 'default',
    });
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
