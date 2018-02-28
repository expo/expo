/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule Kernel
 */
'use strict';

import { DeviceEventEmitter } from 'react-native';

import ApiV2Client from 'ApiV2Client';
import BrowserActions from 'BrowserActions';
import ConsoleActions from 'ConsoleActions';
import ExStore from 'ExStore';
import ExponentKernel from 'ExponentKernel';

let addListenerWithJavaCallback = (eventName, eventListener) => {
  DeviceEventEmitter.addListener(eventName, async event => {
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

addListenerWithJavaCallback('ExponentKernel.clearConsole', async event => {
  ExStore.dispatch(ConsoleActions.clearConsole());

  return {};
});

addListenerWithJavaCallback('ExponentKernel.openManifestUrl', async event => {
  let { manifestUrl, manifestString, bundleUrl } = event;

  let manifest = JSON.parse(manifestString);
  ExStore.dispatch(BrowserActions.navigateToUrlAsync(manifestUrl));
  ExStore.dispatch(BrowserActions.loadBundleAsync(manifestUrl, manifest, bundleUrl));

  return {};
});

// Tell Java that it can send us DeviceEventEmitter events now.
ExponentKernel.onLoaded();
