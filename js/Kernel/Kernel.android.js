/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule Kernel
 */
'use strict';

import {
  DeviceEventEmitter,
  NativeModules,
  AsyncStorage,
} from 'react-native';

import ApiClient from 'ApiClient';
import BrowserActions from 'BrowserActions';
import ConsoleActions from 'ConsoleActions';
import ExManifests from 'ExManifests';
import ExStore from 'ExStore';
import ExponentApp from 'ExponentApp';
import FeaturedExperiences from 'FeaturedExperiences';

const {
  ExponentKernel,
} = NativeModules;

let addListenerWithJavaCallback = (eventName, eventListener) => {
  DeviceEventEmitter.addListener(eventName, async (event) => {
    try {
      let result = await eventListener(event);
      if (!result) {
        result = {};
      }
      ExponentKernel.onEventSuccess(event.eventId, result);
    } catch (e) {
      ExponentKernel.onEventFailure(event.eventId, e.message);
    }
  });
};

addListenerWithJavaCallback('ExponentKernel.clearConsole', async (event) => {
  ExStore.dispatch(ConsoleActions.clearConsole());

  return {};
});

addListenerWithJavaCallback('ExponentKernel.openManifestUrl', async (event) => {
  let { manifestUrl, manifestString, bundleUrl } = event;

  let manifest = JSON.parse(manifestString);
  ExStore.dispatch(BrowserActions.navigateToBundleUrlAsync(manifestUrl, manifest, bundleUrl));

  return {};
});

addListenerWithJavaCallback('ExponentKernel.updateDeviceToken', async (event) => {
  let { deviceToken, deviceId } = event;
  let appId = null;
  let development = null;  // GCM doesn't discriminate between dev and prod
  await ApiClient.updateDeviceToken(deviceToken, deviceId, appId, development, 'gcm');
});

addListenerWithJavaCallback('ExponentKernel.getExponentPushToken', async (event) => {
  let { deviceId, experienceId } = event;
  let result = await ApiClient.getExponentPushToken(deviceId, experienceId);
  return result;
});

// Tell Java that it can send us DeviceEventEmitter events now.
ExponentKernel.onLoaded();

// Preload the experiences that are featured in the NUX
async function preloadExperienceAsync(manifestUrl) {
  let { bundleUrl } = await ExManifests.manifestUrlToBundleUrlAndManifestAsync(manifestUrl);
  // This line causes a bug if uncommmented. This bundle is never cached, even
  // when it's fetched in the future.
  // Can't figure it out right now and there's a good chance it's a bug in
  // OkHttp since RN is using such an old version.
  // await ExponentKernel.preloadBundleUrlAsync(bundleUrl);
}

async function preloadExperiencesAsync() {
  let isFirstRunFinished = await AsyncStorage.getItem(ExponentApp.NUX_HAS_FINISHED_FIRST_RUN);
  if (isFirstRunFinished === 'true') {
    return;
  }

  let featuredExperiences = FeaturedExperiences.getFeatured();
  for (let i = 0; i < featuredExperiences.length; i++) {
    let exp = featuredExperiences[i];
    if (exp.nux) {
      // Do these synchronously so that we don't fetch the public key multiple times
      await preloadExperienceAsync(exp.url);
    }
  }
}

preloadExperiencesAsync();
