/**
 * Copyright (c) 2021 Expo, Inc.
 * Copyright (c) 2018 Drifty Co.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import plist from '@expo/plist';
import Debug from 'debug';
import { Socket, connect } from 'net';

import { ResponseError, ServiceClient } from './ServiceClient';
import { CommandError } from '../../../../utils/errors';
import { parsePlistBuffer } from '../../../../utils/plist';
import { UsbmuxProtocolClient } from '../protocol/UsbmuxProtocol';

const debug = Debug('expo:apple-device:client:usbmuxd');

export interface UsbmuxdDeviceProperties {
  /** @example 'USB' */
  ConnectionType: 'USB' | 'Network';
  /** @example 7 */
  DeviceID: number;
  /** @example 339738624 */
  LocationID?: number;
  /** @example '00008101-001964A22629003A' */
  SerialNumber: string;
  /**
   * Only available for USB connection.
   * @example 480000000
   */
  ConnectionSpeed?: number;
  /**
   * Only available for USB connection.
   * @example 4776
   */
  ProductID?: number;
  /**
   * Only available for USB connection.
   * @example '00008101-001964A22629003A'
   */
  UDID?: string;
  /**
   * Only available for USB connection.
   * @example '00008101001964A22629003A'
   */
  USBSerialNumber?: string;
  /**
   * Only available for Network connection.
   * @example '08:c7:29:05:f2:30@fe80::ac7:29ff:fe05:f230-supportsRP._apple-mobdev2._tcp.local.'
   */
  EscapedFullServiceName?: string;
  /**
   * Only available for Network connection.
   * @example 5
   */
  InterfaceIndex?: number;
  /**
   * Only available for Network connection.
   */
  NetworkAddress?: Buffer;
}

export interface UsbmuxdDevice {
  /** @example 7 */
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
  constructor(public socket: Socket) {
    super(socket, new UsbmuxProtocolClient(socket));
  }

  static connectUsbmuxdSocket(): Socket {
    debug('connectUsbmuxdSocket');
    if (process.platform === 'win32') {
      return connect({ port: 27015, host: 'localhost' });
    } else {
      return connect({ path: '/var/run/usbmuxd' });
    }
  }

  async connect(device: Pick<UsbmuxdDevice, 'DeviceID'>, port: number): Promise<Socket> {
    debug(`connect: ${device.DeviceID} on port ${port}`);
    debug(`connect:device: %O`, device);

    const response = await this.protocolClient.sendMessage({
      messageType: 'Connect',
      extraFields: {
        DeviceID: device.DeviceID,
        PortNumber: htons(port),
      },
    });
    debug(`connect:device:response: %O`, response);

    if (isUsbmuxdConnectResponse(response) && response.Number === 0) {
      return this.protocolClient.socket;
    } else {
      throw new ResponseError(
        `There was an error connecting to the USB connected device (id: ${device.DeviceID}, port: ${port})`,
        response
      );
    }
  }

  async getDevices(): Promise<UsbmuxdDevice[]> {
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

  async getDevice(udid?: string): Promise<UsbmuxdDevice> {
    debug(`getDevice ${udid ? 'udid: ' + udid : ''}`);
    const devices = await this.getDevices();

    if (!devices.length) {
      throw new CommandError('APPLE_DEVICE_USBMUXD', 'No devices found');
    }

    if (!udid) {
      return devices[0];
    }

    for (const device of devices) {
      if (device.Properties && device.Properties.SerialNumber === udid) {
        return device;
      }
    }

    throw new CommandError('APPLE_DEVICE_USBMUXD', `No device found (udid: ${udid})`);
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
      throw new ResponseError(
        `There was an error reading pair record for device (udid: ${udid})`,
        resp
      );
    }
  }
}

function htons(n: number): number {
  return ((n & 0xff) << 8) | ((n >> 8) & 0xff);
}
