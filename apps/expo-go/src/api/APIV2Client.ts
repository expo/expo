import { Platform } from 'react-native';

import { ApiError } from './ApiError';
import Config from './Config';
import { GenericError } from './GenericError';
import * as Kernel from '../kernel/Kernel';
import Store from '../redux/Store';

type SendOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: object;
  searchParams?: Record<string, string>;
};
export class APIV2Client {
  private async sendApiV2Request<TData>(route: string, options: SendOptions): Promise<TData> {
    const url = new URL(`${Config.api.origin}/--/api/v2/${route}`);
    if (options.searchParams) {
      url.search = new URLSearchParams(options?.searchParams).toString();
    }

    let response: Response;
    try {
      response = await fetch(url.toString(), {
        method: options.method ?? 'POST',
        body: options.body ? JSON.stringify(options.body) : null,
        headers: {
          ...options.headers,
          accept: 'application/json',
          ...(options.body ? { 'content-type': 'application/json' } : null),
        },
      });
    } catch (error) {
      throw new GenericError(
        `Something went wrong when connecting to Expo: ${(error as Error).message}.`
      );
    }

    let text: string;
    try {
      text = await response.text();
    } catch (error) {
      throw new GenericError(
        `Something went wrong when reading the response (HTTP ${response.status}) from Expo: ${
          (error as Error).message
        }.`
      );
    }

    let body: any;
    try {
      body = JSON.parse(text);
    } catch {
      throw new GenericError(`The Expo server responded in an unexpected way: ${text}`);
    }

    if (Array.isArray(body.errors) && body.errors.length > 0) {
      const responseError = body.errors[0];
      const errorMessage = responseError.details
        ? responseError.details.message
        : responseError.message;
      const error = new ApiError(errorMessage, responseError.code);
      error.serverStack = responseError.stack;
      error.metadata = responseError.metadata;
      throw error;
    }

    if (!response.ok) {
      throw new GenericError(`The Expo server responded with a ${response.status} error.`);
    }

    return body.data;
  }

  public async sendAuthenticatedApiV2Request<TData>(
    route: string,
    options: SendOptions = {}
  ): Promise<TData> {
    const { session } = Store.getState();

    const sessionSecret = session.sessionSecret;

    if (!sessionSecret) {
      throw new ApiError('Must be logged in to perform request');
    }

    const newOptions = {
      ...options,
      headers: {
        ...options.headers,
        ...(sessionSecret
          ? {
              'Expo-SDK-Version': Kernel.sdkVersions,
              'Expo-Platform': Platform.OS,
              'Expo-Session': sessionSecret,
            }
          : {}),
      },
    };
    return await this.sendApiV2Request(route, newOptions);
  }

  public async sendOptionallyAuthenticatedApiV2Request<TData>(
    route: string,
    options: SendOptions = {}
  ): Promise<TData> {
    const { session } = Store.getState();

    const sessionSecret = session.sessionSecret;
    const newOptions = {
      ...options,
      headers: {
        ...options.headers,
        ...(sessionSecret
          ? {
              'Expo-SDK-Version': Kernel.sdkVersions,
              'Expo-Platform': Platform.OS,
              'Expo-Session': sessionSecret,
            }
          : {}),
      },
    };
    return await this.sendApiV2Request(route, newOptions);
  }

  public async sendUnauthenticatedApiV2Request<TData>(
    route: string,
    options: SendOptions = {}
  ): Promise<TData> {
    return await this.sendApiV2Request(route, options);
  }
}
