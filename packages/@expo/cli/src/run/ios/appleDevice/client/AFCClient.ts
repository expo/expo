/**
 * Copyright (c) 2021 Expo, Inc.
 * Copyright (c) 2018 Drifty Co.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import Debug from 'debug';
import * as fs from 'fs';
import { Socket } from 'net';
import * as path from 'path';
import { promisify } from 'util';

import { ServiceClient } from './ServiceClient';
import { CommandError } from '../../../../utils/errors';
import {
  AFC_FILE_OPEN_FLAGS,
  AFC_OPS,
  AFC_STATUS,
  AFCError,
  AFCProtocolClient,
  AFCResponse,
} from '../protocol/AFCProtocol';

const debug = Debug('expo:apple-device:client:afc');
const MAX_OPEN_FILES = 240;

export class AFCClient extends ServiceClient<AFCProtocolClient> {
  constructor(public socket: Socket) {
    super(socket, new AFCProtocolClient(socket));
  }

  async getFileInfo(path: string): Promise<string[]> {
    debug(`getFileInfo: ${path}`);

    const response = await this.protocolClient.sendMessage({
      operation: AFC_OPS.GET_FILE_INFO,
      data: toCString(path),
    });
    debug(`getFileInfo:response: %O`, response);

    const strings: string[] = [];
    let currentString = '';
    const tokens = response.data;
    tokens.forEach((token) => {
      if (token === 0) {
        strings.push(currentString);
        currentString = '';
      } else {
        currentString += String.fromCharCode(token);
      }
    });
    return strings;
  }

  async writeFile(fd: Buffer, data: Buffer): Promise<AFCResponse> {
    debug(`writeFile: ${Array.prototype.toString.call(fd)} data size: ${data.length}`);

    const response = await this.protocolClient.sendMessage({
      operation: AFC_OPS.FILE_WRITE,
      data: fd,
      payload: data,
    });

    debug(`writeFile:response:`, response);
    return response;
  }

  protected async openFile(path: string): Promise<Buffer> {
    debug(`openFile: ${path}`);
    // mode + path + null terminator
    const data = Buffer.alloc(8 + path.length + 1);
    // write mode
    data.writeUInt32LE(AFC_FILE_OPEN_FLAGS.WRONLY, 0);
    // then path to file
    toCString(path).copy(data, 8);

    const response = await this.protocolClient.sendMessage({
      operation: AFC_OPS.FILE_OPEN,
      data,
    });

    // debug(`openFile:response:`, response);

    if (response.operation === AFC_OPS.FILE_OPEN_RES) {
      return response.data;
    }

    throw new CommandError(
      'APPLE_DEVICE_AFC',
      `There was an unknown error opening file ${path}, response: ${Array.prototype.toString.call(
        response.data
      )}`
    );
  }

  protected async closeFile(fd: Buffer): Promise<AFCResponse> {
    debug(`closeFile fd: ${Array.prototype.toString.call(fd)}`);
    const response = await this.protocolClient.sendMessage({
      operation: AFC_OPS.FILE_CLOSE,
      data: fd,
    });

    debug(`closeFile:response:`, response);
    return response;
  }

  protected async uploadFile(srcPath: string, destPath: string): Promise<void> {
    debug(`uploadFile: ${srcPath}, ${destPath}`);

    // read local file and get fd of destination
    const [srcFile, destFile] = await Promise.all([
      await promisify(fs.readFile)(srcPath),
      await this.openFile(destPath),
    ]);

    try {
      await this.writeFile(destFile, srcFile);
      await this.closeFile(destFile);
    } catch (err) {
      await this.closeFile(destFile);
      throw err;
    }
  }

  async makeDirectory(path: string): Promise<AFCResponse> {
    debug(`makeDirectory: ${path}`);

    const response = await this.protocolClient.sendMessage({
      operation: AFC_OPS.MAKE_DIR,
      data: toCString(path),
    });

    debug(`makeDirectory:response:`, response);
    return response;
  }

  async uploadDirectory(srcPath: string, destPath: string): Promise<void> {
    debug(`uploadDirectory: ${srcPath}`);
    await this.makeDirectory(destPath);

    // AFC doesn't seem to give out more than 240 file handles,
    // so we delay any requests that would push us over until more open up
    let numOpenFiles = 0;
    const pendingFileUploads: (() => void)[] = [];
    const _this = this;
    return uploadDir(srcPath);

    async function uploadDir(dirPath: string): Promise<void> {
      const promises: Promise<void>[] = [];
      for (const file of fs.readdirSync(dirPath)) {
        const filePath = path.join(dirPath, file);
        const remotePath = path.join(destPath, path.relative(srcPath, filePath));
        if (fs.lstatSync(filePath).isDirectory()) {
          promises.push(_this.makeDirectory(remotePath).then(() => uploadDir(filePath)));
        } else {
          // Create promise to add to promises array
          // this way it can be resolved once a pending upload has finished
          let resolve: (val?: any) => void;
          let reject: (err: AFCError) => void;
          const promise = new Promise<void>((res, rej) => {
            resolve = res;
            reject = rej;
          });
          promises.push(promise);

          // wrap upload in a function in case we need to save it for later
          const uploadFile = (tries = 0) => {
            numOpenFiles++;
            _this
              .uploadFile(filePath, remotePath)
              .then(() => {
                resolve();
                numOpenFiles--;
                const fn = pendingFileUploads.pop();
                if (fn) {
                  fn();
                }
              })
              .catch((err: AFCError) => {
                // Couldn't get fd for whatever reason, try again
                // # of retries is arbitrary and can be adjusted
                if (err.status === AFC_STATUS.NO_RESOURCES && tries < 10) {
                  debug(`Received NO_RESOURCES from AFC, retrying ${filePath} upload. ${tries}`);
                  uploadFile(tries++);
                } else {
                  numOpenFiles--;
                  reject(err);
                }
              });
          };

          if (numOpenFiles < MAX_OPEN_FILES) {
            uploadFile();
          } else {
            debug(
              `numOpenFiles >= ${MAX_OPEN_FILES}, adding to pending queue. Length: ${pendingFileUploads.length}`
            );
            pendingFileUploads.push(uploadFile);
          }
        }
      }
      await Promise.all(promises);
    }
  }
}

function toCString(s: string) {
  const buf = Buffer.alloc(s.length + 1);
  const len = buf.write(s);
  buf.writeUInt8(0, len);
  return buf;
}
