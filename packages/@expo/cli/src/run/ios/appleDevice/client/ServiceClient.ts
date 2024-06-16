/**
 * Copyright (c) 2021 Expo, Inc.
 * Copyright (c) 2018 Drifty Co.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { Socket } from 'net';

import { CommandError } from '../../../../utils/errors';
import { ProtocolClient } from '../protocol/AbstractProtocol';

export abstract class ServiceClient<T extends ProtocolClient> {
  constructor(
    public socket: Socket,
    protected protocolClient: T
  ) {}
}

export class ResponseError extends CommandError {
  constructor(
    msg: string,
    public response: any
  ) {
    super(msg);
  }
}
