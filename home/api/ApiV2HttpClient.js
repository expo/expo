/**
 * @providesModule ApiV2HttpClient
 * @flow
 */
'use strict';

import { NativeModules, Platform } from 'react-native';
import querystring from 'querystring';

import ApiV2Error from 'ApiV2Error';
import Config from './Config';

const { ExponentKernel } = NativeModules;

type RequestOptions = {
  httpMethod: 'get' | 'post',
  queryParameters?: ?QueryParameters,
  body?: ?Object,
};

type QueryParameters = { [key: string]: ?(string | number | boolean) };

export default class ApiV2HttpClient {
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
    let url = `${Config.api.host}/--/api/v2/${encodeURI(methodName)}`;
    if (options.queryParameters) {
      url += '?' + querystring.stringify(options.queryParameters);
    }

    let fetchOptions: any = {
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
      let error: any = new Error(`There was a problem understanding the server.`);
      error.responseBody = resultText;
      throw error;
    }

    if (!result || typeof result !== 'object') {
      let error: any = new Error(`There was a problem understanding the server.`);
      error.responseBody = result;
      throw error;
    }

    if (result.errors && result.errors.length) {
      let responseError = result.errors[0];
      let error = new ApiV2Error(responseError.message, responseError.code);
      error.serverStack = responseError.stack;
      throw error;
    }

    return result.data;
  }
}
