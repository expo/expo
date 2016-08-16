/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule Kernel
 */
'use strict';

import {
  DeviceEventEmitter,
  NativeModules,
} from 'react-native';

import ApiClient from 'ApiClient';

const {
  ExponentKernel,
} = NativeModules;

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
    await ApiClient.updateDeviceToken(deviceToken, deviceId, appId, development, 'apns');
  });

  addListenerWithNativeCallback('ExponentKernel.getExponentPushToken', async (event) => {
    let { deviceId, experienceId } = event;
    let result = await ApiClient.getExponentPushToken(deviceId, experienceId);
    return result;
  });

  ExponentKernel.onLoaded();
}
