/**
 * Copyright (c) 2021 Expo, Inc.
 * Copyright (c) 2018 Drifty Co.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import plist from '@expo/plist';
import Debug from 'debug';
import * as net from 'net';

import { parsePlistBuffer } from '../../../../../utils/parseBinaryPlistAsync';
import { UsbmuxProtocolClient } from '../protocol/usbmux';
import { ResponseError, ServiceClient } from './client';

const debug = Debug('expo:ios:lib:client:usbmuxd');

export interface UsbmuxdDeviceProperties {
  ConnectionSpeed: number;
  ConnectionType: 'USB';
  DeviceID: number;
  LocationID: number;
  ProductID: number;
  SerialNumber: string;
}

export interface UsbmuxdDevice {
  DeviceID: number;
  MessageType: 'Attached'; // TODO: what else?
  Properties: UsbmuxdDeviceProperties;
}

export interface UsbmuxdConnectResponse {
  MessageType: 'Result';
  Number: number;
}

export interface UsbmuxdDeviceResponse {
  DeviceList: UsbmuxdDevice[];
}

export interface UsbmuxdPairRecordResponse {
  PairRecordData: Buffer;
}

export interface UsbmuxdPairRecord {
  DeviceCertificate: Buffer;
  EscrowBag: Buffer;
  HostCertificate: Buffer;
  HostID: string;
  HostPrivateKey: Buffer;
  RootCertificate: Buffer;
  RootPrivateKey: Buffer;
  SystemBUID: string;
  WiFiMACAddress: string;
}

function isUsbmuxdConnectResponse(resp: any): resp is UsbmuxdConnectResponse {
  return resp.MessageType === 'Result' && resp.Number !== undefined;
}

function isUsbmuxdDeviceResponse(resp: any): resp is UsbmuxdDeviceResponse {
  return resp.DeviceList !== undefined;
}

function isUsbmuxdPairRecordResponse(resp: any): resp is UsbmuxdPairRecordResponse {
  return resp.PairRecordData !== undefined;
}

export class UsbmuxdClient extends ServiceClient<UsbmuxProtocolClient> {
  constructor(public socket: net.Socket) {
    super(socket, new UsbmuxProtocolClient(socket));
  }

  static connectUsbmuxdSocket() {
    debug('connectUsbmuxdSocket');
    if (process.platform === 'win32') {
      return net.connect({ port: 27015, host: 'localhost' });
    } else {
      return net.connect({ path: '/var/run/usbmuxd' });
    }
  }

  async connect(device: UsbmuxdDevice, port: number) {
    debug(`connect: ${device.DeviceID} on port ${port}`);

    const resp = await this.protocolClient.sendMessage({
      messageType: 'Connect',
      extraFields: {
        DeviceID: device.DeviceID,
        PortNumber: htons(port),
      },
    });

    if (isUsbmuxdConnectResponse(resp) && resp.Number === 0) {
      return this.protocolClient.socket;
    } else {
      throw new ResponseError(
        `There was an error connecting to ${device.DeviceID} on port ${port}`,
        resp
      );
    }
  }

  async getDevices() {
    debug('getDevices');

    const resp = await this.protocolClient.sendMessage({
      messageType: 'ListDevices',
    });

    if (isUsbmuxdDeviceResponse(resp)) {
      return resp.DeviceList;
    } else {
      throw new ResponseError('Invalid response from getDevices', resp);
    }
  }

  async getDevice(udid?: string) {
    debug(`getDevice ${udid ? 'udid: ' + udid : ''}`);
    const devices = await this.getDevices();

    if (!devices.length) {
      throw new Error('No devices found');
    }

    if (!udid) {
      return devices[0];
    }

    for (const device of devices) {
      if (device.Properties && device.Properties.SerialNumber === udid) {
        return device;
      }
    }

    throw new Error(`No device with udid ${udid} found`);
  }

  async readPairRecord(udid: string): Promise<UsbmuxdPairRecord> {
    debug(`readPairRecord: ${udid}`);

    const resp = await this.protocolClient.sendMessage({
      messageType: 'ReadPairRecord',
      extraFields: { PairRecordID: udid },
    });

    if (isUsbmuxdPairRecordResponse(resp)) {
      // the pair record can be created as a binary plist
      const BPLIST_MAGIC = Buffer.from('bplist00');
      if (BPLIST_MAGIC.compare(resp.PairRecordData, 0, 8) === 0) {
        debug('Binary plist pair record detected.');
        return parsePlistBuffer(resp.PairRecordData)[0];
      } else {
        // TODO: use parsePlistBuffer
        return plist.parse(resp.PairRecordData.toString()) as any; // TODO: type guard
      }
    } else {
      throw new ResponseError(`There was an error reading pair record for udid: ${udid}`, resp);
    }
  }
}

function htons(n: number) {
  return ((n & 0xff) << 8) | ((n >> 8) & 0xff);
}
