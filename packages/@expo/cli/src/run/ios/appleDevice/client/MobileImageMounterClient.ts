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

import { ResponseError, ServiceClient } from './ServiceClient';
import type { LockdownCommand, LockdownResponse } from '../protocol/LockdownProtocol';
import { isLockdownResponse, LockdownProtocolClient } from '../protocol/LockdownProtocol';

const debug = Debug('expo:apple-device:client:mobile_image_mounter');

export type MIMMountResponse = LockdownResponse;

export interface MIMMessage extends LockdownCommand {
  ImageType: string;
}

export interface MIMLookupResponse extends LockdownResponse {
  ImageSignature?: string;
}

export interface MIMUploadCompleteResponse extends LockdownResponse {
  Status: 'Complete';
}

export interface MIMUploadReceiveBytesResponse extends LockdownResponse {
  Status: 'ReceiveBytesAck';
}

function isMIMUploadCompleteResponse(resp: any): resp is MIMUploadCompleteResponse {
  return resp.Status === 'Complete';
}

function isMIMUploadReceiveBytesResponse(resp: any): resp is MIMUploadReceiveBytesResponse {
  return resp.Status === 'ReceiveBytesAck';
}

export class MobileImageMounterClient extends ServiceClient<LockdownProtocolClient<MIMMessage>> {
  constructor(socket: Socket) {
    super(socket, new LockdownProtocolClient(socket));
  }

  async mountImage(imagePath: string, imageSig: Buffer) {
    debug(`mountImage: ${imagePath}`);

    const resp = await this.protocolClient.sendMessage({
      Command: 'MountImage',
      ImagePath: imagePath,
      ImageSignature: imageSig,
      ImageType: 'Developer',
    });

    if (!isLockdownResponse(resp) || resp.Status !== 'Complete') {
      throw new ResponseError(`There was an error mounting ${imagePath} on device`, resp);
    }
  }

  async uploadImage(imagePath: string, imageSig: Buffer) {
    debug(`uploadImage: ${imagePath}`);

    const imageSize = fs.statSync(imagePath).size;
    return this.protocolClient.sendMessage(
      {
        Command: 'ReceiveBytes',
        ImageSize: imageSize,
        ImageSignature: imageSig,
        ImageType: 'Developer',
      },
      (resp: any, resolve, reject) => {
        if (isMIMUploadReceiveBytesResponse(resp)) {
          const imageStream = fs.createReadStream(imagePath);
          imageStream.pipe(this.protocolClient.socket, { end: false });
          imageStream.on('error', (err) => reject(err));
        } else if (isMIMUploadCompleteResponse(resp)) {
          resolve();
        } else {
          reject(
            new ResponseError(`There was an error uploading image ${imagePath} to the device`, resp)
          );
        }
      }
    );
  }

  async lookupImage() {
    debug('lookupImage');

    return this.protocolClient.sendMessage<MIMLookupResponse>({
      Command: 'LookupImage',
      ImageType: 'Developer',
    });
  }
}
