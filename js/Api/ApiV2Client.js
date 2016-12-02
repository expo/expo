/**
 * @providesModule ApiV2Client
 * @flow
 */
'use strict';

import {
  NativeModules,
  Platform,
} from 'react-native';
import querystring from 'querystring';

import ApiV2Error from 'ApiV2Error';
import Config from 'Config';

const {
  ExponentKernel,
} = NativeModules;

type RequestOptions = {
  httpMethod: 'get' | 'post',
  queryParameters?: QueryParameters,
  body?: ?Object,
};

type QueryParameters = {[key: string]: ?(string | number | boolean)};

export default class ApiV2Client {
  async getAsync(methodName: string, args: ?QueryParameters): Promise<*> {
    return this._requestAsync(methodName, {
      httpMethod: 'get',
      queryParameters: args,
    });
  }

  async postAsync(methodName: string, args: ?Object): Promise<*> {
    return this._requestAsync(methodName, {
      httpMethod: 'post',
      body: args,
    });
  }

  async _requestAsync(methodName: string, options: RequestOptions): Promise<*> {
    let url = `${Config.api.host}/--/api/v2/${encodeURIComponent(methodName)}`;
    if (options.queryParameters) {
      url += '?' + querystring.stringify(options.queryParameters);
    }

    let fetchOptions = {
      method: options.httpMethod,
      headers: {
        'Exponent-SDK-Version': ExponentKernel.sdkVersions,
        'Exponent-Platform': Platform.OS,
      },
    };
    if (options.body) {
      fetchOptions.headers['Content-Type'] = 'application/json';
      fetchOptions.body = JSON.stringify(options.body);
    }

    // We expect the result to be JSON
    let response = await fetch(url, fetchOptions);
    let resultText = await response.text();
    let result;
    try {
      result = JSON.parse(resultText);
    } catch (e) {
      let error = new Error(`There was a problem communicating with the server. Please try again.`);
      error.responseBody = resultText;
      throw error;
    }

    if (result && result.error) {
      let error = new ApiV2Error(result.error, result.code);
      error.serverStack = result.stack;
      throw error;
    }

    return result;
  }
}
