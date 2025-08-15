/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// @ts-expect-error
import { Networking } from 'react-native';

type Subscriber = { remove: () => void };

class LoadBundleFromServerError extends Error {
  name = 'LoadBundleFromServerError';

  constructor(
    message: string,
    public url: string,
    public isTimeout: boolean,
    options?: ErrorOptions
  ) {
    super(message, options);
  }
}

class LoadBundleFromServerRequestError extends LoadBundleFromServerError {
  name = 'LoadBundleFromServerRequestError';
}

export function fetchAsync(
  url: string
): Promise<{ body: string; status: number; headers: Record<string, string> }> {
  let id: string | null = null;
  let statusCode: number | null = null;
  let responseText: string | null = null;
  let headers: Record<string, string> = {};
  let dataListener: Subscriber | null = null;
  let completeListener: Subscriber | null = null;
  let responseListener: Subscriber | null = null;
  let incrementalDataListener: Subscriber | null = null;
  return new Promise<{ body: string; status: number; headers: Record<string, string> }>(
    (resolve, reject) => {
      const addListener = Networking.addListener.bind() as (
        event: string,
        callback: (props: [string, any, any]) => any
      ) => Subscriber;
      dataListener = addListener('didReceiveNetworkData', ([requestId, response]) => {
        if (requestId === id) {
          responseText = response;
        }
      });
      incrementalDataListener = addListener(
        'didReceiveNetworkIncrementalData',
        ([requestId, data]) => {
          if (requestId === id) {
            if (responseText != null) {
              responseText += data;
            } else {
              responseText = data;
            }
          }
        }
      );
      responseListener = addListener(
        'didReceiveNetworkResponse',
        ([requestId, status, responseHeaders]) => {
          if (requestId === id) {
            statusCode = status;
            headers = responseHeaders;
          }
        }
      );
      completeListener = addListener(
        'didCompleteNetworkResponse',
        ([requestId, error, isTimeout]) => {
          if (requestId === id) {
            if (error) {
              reject(
                new LoadBundleFromServerRequestError('Could not load bundle', url, isTimeout, {
                  cause: error,
                })
              );
            } else {
              resolve({ body: responseText!, status: statusCode!, headers });
            }
          }
        }
      );
      (Networking.sendRequest as any)(
        'GET',
        'asyncRequest',
        url,
        {
          'expo-platform': process.env.EXPO_OS,
        },
        '',
        'text',
        true,
        0,
        (requestId: string) => {
          id = requestId;
        },
        true
      );
    }
  ).finally(() => {
    dataListener?.remove();
    completeListener?.remove();
    responseListener?.remove();
    incrementalDataListener?.remove();
  });
}
