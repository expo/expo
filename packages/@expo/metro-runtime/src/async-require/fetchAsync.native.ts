/**
 * Copyright (c) Evan Bacon.
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Platform } from 'react-native';
// @ts-expect-error
import Networking from 'react-native/Libraries/Network/RCTNetworking';

type Subscriber = { remove: () => void };

export function fetchAsync(
  url: string
): Promise<{ body: string; headers: Record<string, string> }> {
  let id: string | null = null;
  let responseText: string | null = null;
  let headers: Record<string, string> = {};
  let dataListener: Subscriber | null = null;
  let completeListener: Subscriber | null = null;
  let responseListener: Subscriber | null = null;
  return new Promise<{ body: string; headers: Record<string, string> }>((resolve, reject) => {
    const addListener = Networking.addListener as (
      event: string,
      callback: (props: [string, any, any]) => any
    ) => Subscriber;
    dataListener = addListener('didReceiveNetworkData', ([requestId, response]) => {
      if (requestId === id) {
        responseText = response;
      }
    });
    responseListener = addListener(
      'didReceiveNetworkResponse',
      ([requestId, status, responseHeaders]) => {
        if (requestId === id) {
          headers = responseHeaders;
        }
      }
    );
    completeListener = addListener('didCompleteNetworkResponse', ([requestId, error]) => {
      if (requestId === id) {
        if (error) {
          reject(error);
        } else {
          resolve({ body: responseText!, headers });
        }
      }
    });
    (Networking.sendRequest as any)(
      'GET',
      'asyncRequest',
      url,
      {
        'expo-platform': Platform.OS,
      },
      '',
      'text',
      false,
      0,
      (requestId: string) => {
        id = requestId;
      },
      true
    );
  }).finally(() => {
    dataListener?.remove();
    completeListener?.remove();
    responseListener?.remove();
  });
}
