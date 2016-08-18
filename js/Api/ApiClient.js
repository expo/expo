/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule ApiClient
 */
'use strict';

import {
  NativeModules,
  Platform,
} from 'react-native';

import Config from 'Config';
import ExStore from 'ExStore';

let {
  ExponentKernel,
} = NativeModules;

function exponentHeaders() {
  return {
    'Exponent-SDK-Version': ExponentKernel.sdkVersions,
    'Exponent-Platform': Platform.OS,
  };
}

export default class ApiClient {
  static callExpHostMethodAsync(methodName, args, method, requestBody) {
    let emailAddress = ExStore.getState().account.email;
    let url = Config.api.host + '/--/api/' + encodeURIComponent(methodName) + '/' +
      encodeURIComponent(JSON.stringify(args)) +
      '?emailAddress=' + encodeURIComponent(emailAddress);

    let fetchOpts = {
      method: method || 'get',
    };
    let headers = exponentHeaders();
    if (requestBody) {
      fetchOpts = {
        ...fetchOpts,
        body: JSON.stringify(requestBody),
      };

      headers['Content-Type'] = 'application/json';
    }

    fetchOpts.headers = headers;

    console.log(`Fetching url: ${url}`);
    console.log(`With opts: ${JSON.stringify(fetchOpts)}`);
    return fetch(url, fetchOpts)
      .then(response => response.text())
      .then(responseText => {
        try {
          var responseObj = JSON.parse(responseText);
        } catch (e) {
          let err = new Error(`Invalid JSON returned from API: ${e.message}`);
          err.response = responseText;
          return Promise.reject(err);
        }
        if (responseObj.err) {
          let err = new Error(`API Response Error: ${responseObj.err}`);
          err.serverError = responseObj.err;
          return Promise.reject(err);
        } else {
          return responseObj;
        }
      });
  }

  static async fetchManifestAsync(url, shouldRequestSignedManifest) {
    try {
      let headers = exponentHeaders();
      if (shouldRequestSignedManifest) {
        headers['Exponent-Accept-Signature'] = true;
      }
      let response = await fetch(url, {headers});
      let text = await response.text();
      if (response.ok) {
        return text;
      } else {
        throw new Error(text);
      }
    } catch (e) {
      throw new Error(`Error fetching ${url}: ${e.message}.`);
    }
  }

  static recordEmailAsync(emailAddress) {
    return ApiClient.callExpHostMethodAsync('recordEmail', [emailAddress]);
  }

  static updateDeviceToken(deviceToken, deviceId, appId, development, type) {
    let payload = {deviceToken, deviceId, appId, type};
    if (development) {
      payload.development = development;
    }
    return ApiClient.callExpHostMethodAsync('updateDeviceToken', [payload], 'post', {});
  }

  static getExponentPushToken(deviceId, experienceId) {
    return ApiClient.callExpHostMethodAsync('getExponentPushToken', [{deviceId, experienceId}], 'post', {});
  }
}
