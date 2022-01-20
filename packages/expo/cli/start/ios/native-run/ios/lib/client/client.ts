/**
 * Copyright (c) 2021 Expo, Inc.
 * Copyright (c) 2018 Drifty Co.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type * as net from 'net';

import type { ProtocolClient } from '../protocol';

export abstract class ServiceClient<T extends ProtocolClient> {
  constructor(public socket: net.Socket, protected protocolClient: T) {}
}

export class ResponseError extends Error {
  constructor(msg: string, public response: any) {
    super(msg);
  }
}
