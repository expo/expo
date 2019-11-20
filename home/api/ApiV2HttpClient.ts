import querystring from 'querystring';
import { Platform } from 'react-native';

import ApiV2Error from './ApiV2Error';
import Config from './Config';
import * as Kernel from '../kernel/Kernel';
import Store from '../redux/Store';

type RequestOptions = {
  httpMethod: 'get' | 'post';
  queryParameters?: QueryParameters;
  body?: any;
};

type QueryParameters = { [key: string]: string | number | boolean | null | undefined };

export default class ApiV2HttpClient {
  async getAsync<R = any>(methodName: string, args?: QueryParameters): Promise<R> {
    return this._requestAsync<R>(methodName, {
      httpMethod: 'get',
      queryParameters: args,
    });
  }

  async postAsync<R = any>(methodName: string, args?: any): Promise<R> {
    return this._requestAsync<R>(methodName, {
      httpMethod: 'post',
      body: args,
    });
  }

  async _requestAsync<R>(methodName: string, options: RequestOptions): Promise<R> {
    let url = `${Config.api.host}/--/api/v2/${encodeURI(methodName)}`;
    if (options.queryParameters) {
      url += '?' + querystring.stringify(options.queryParameters);
    }

    let { session } = Store.getState();
    let fetchOptions: any = {
      method: options.httpMethod,
      headers: {
        'Expo-SDK-Version': Kernel.sdkVersions,
        'Expo-Platform': Platform.OS,
        ...(session.sessionSecret ? { 'expo-session': session.sessionSecret } : null),
      },
    };
    if (options.body) {
      fetchOptions.headers['Content-Type'] = 'application/json';
      fetchOptions.body = JSON.stringify(options.body);
    }

    // We expect the result to be JSON
    let response = await fetch(url, fetchOptions);
    let resultText = await response.text();
    let result: any;
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
