/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule Kernel
 * @flow
 */
'use strict';

import {
  DeviceEventEmitter,
  NativeModules,
} from 'react-native';

import ApiV2Client from 'ApiV2Client';
import ExponentKernel from 'ExponentKernel';

if (ExponentKernel && ExponentKernel.onLoaded) {
  let addListenerWithNativeCallback = (eventName, eventListener) => {
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

  addListenerWithNativeCallback('ExponentKernel.updateDeviceToken', async (event) => {
    let { deviceToken, deviceId, appId, development } = event;
    return ApiV2Client.updateDeviceTokenAsync(deviceToken, 'apns', {
      appId,
      deviceId,
      development,
    });
  });

  addListenerWithNativeCallback('ExponentKernel.getExponentPushToken', async (event) => {
    let { deviceId, experienceId } = event;
    return ApiV2Client.getExponentPushTokenAsync(
      deviceId,
      experienceId,
    );
  });
}
