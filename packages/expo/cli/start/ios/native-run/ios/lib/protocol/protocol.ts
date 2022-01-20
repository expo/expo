/**
 * Copyright (c) 2021 Expo, Inc.
 * Copyright (c) 2018 Drifty Co.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import plist from '@expo/plist';
import type * as net from 'net';

import { parsePlistBuffer } from '../../../../../utils/parseBinaryPlistAsync';

const BPLIST_MAGIC = Buffer.from('bplist00');

export type ProtocolReaderCallback = (resp: any, err?: Error) => void;

export class ProtocolReaderFactory<T> {
  constructor(private ProtocolReader: new (callback: ProtocolReaderCallback) => T) {}

  create(callback: (resp: any, err?: Error) => void): T {
    return new this.ProtocolReader(callback);
  }
}

export abstract class ProtocolReader {
  protected body!: Buffer; // TODO: ! -> ?
  protected bodyLength!: number; // TODO: ! -> ?
  protected buffer = Buffer.alloc(0);
  constructor(protected headerSize: number, protected callback: ProtocolReaderCallback) {
    this.onData = this.onData.bind(this);
  }

  /** Returns length of body, or -1 if header doesn't contain length */
  protected abstract parseHeader(data: Buffer): number;
  protected abstract parseBody(data: Buffer): any;

  onData(data?: Buffer) {
    try {
      // if there's data, add it on to existing buffer
      this.buffer = data ? Buffer.concat([this.buffer, data]) : this.buffer;
      // we haven't gotten the body length from the header yet
      if (!this.bodyLength) {
        if (this.buffer.length < this.headerSize) {
          // partial header, wait for rest
          return;
        }
        this.bodyLength = this.parseHeader(this.buffer);
        // move on to body
        this.buffer = this.buffer.slice(this.headerSize);
        if (!this.buffer.length) {
          // only got header, wait for body
          return;
        }
      }
      if (this.buffer.length < this.bodyLength) {
        // wait for rest of body
        return;
      }

      if (this.bodyLength === -1) {
        this.callback(this.parseBody(this.buffer));
        this.buffer = Buffer.alloc(0);
      } else {
        this.body = this.buffer.slice(0, this.bodyLength);
        this.bodyLength -= this.body.length;
        if (!this.bodyLength) {
          this.callback(this.parseBody(this.body));
        }
        this.buffer = this.buffer.slice(this.body.length);
        // There are multiple messages here, call parse again
        if (this.buffer.length) {
          this.onData();
        }
      }
    } catch (err: any) {
      this.callback(null, err);
    }
  }
}

export abstract class PlistProtocolReader extends ProtocolReader {
  protected parseBody(body: Buffer) {
    if (BPLIST_MAGIC.compare(body, 0, 8) === 0) {
      return parsePlistBuffer(body);
    } else {
      return plist.parse(body.toString('utf8'));
    }
  }
}

export interface ProtocolWriter {
  write(sock: net.Socket, msg: any): void;
}

export abstract class ProtocolClient<MessageType = any> {
  constructor(
    public socket: net.Socket,
    protected readerFactory: ProtocolReaderFactory<ProtocolReader>,
    protected writer: ProtocolWriter
  ) {}

  sendMessage<ResponseType = any>(msg: MessageType): Promise<ResponseType>;
  sendMessage<CallbackType = void, ResponseType = any>(
    msg: MessageType,
    callback: (response: ResponseType, resolve: any, reject: any) => void
  ): Promise<CallbackType>;
  sendMessage<CallbackType = void, ResponseType = any>(
    msg: MessageType,
    callback?: (response: ResponseType, resolve: any, reject: any) => void
  ): Promise<CallbackType | ResponseType> {
    return new Promise<ResponseType | CallbackType>((resolve, reject) => {
      const reader = this.readerFactory.create(async (resp: ResponseType, err?: Error) => {
        if (err) {
          reject(err);
          return;
        }
        if (callback) {
          callback(
            resp,
            (value: any) => {
              this.socket.removeListener('data', reader.onData);
              resolve(value);
            },
            reject
          );
        } else {
          this.socket.removeListener('data', reader.onData);
          resolve(resp);
        }
      });
      this.socket.on('data', reader.onData);
      this.writer.write(this.socket, msg);
    });
  }
}
