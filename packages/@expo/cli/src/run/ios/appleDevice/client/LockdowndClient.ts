/**
 * Copyright (c) 2021 Expo, Inc.
 * Copyright (c) 2018 Drifty Co.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import Debug from 'debug';
import { Socket } from 'net';
import * as tls from 'tls';

import { ResponseError, ServiceClient } from './ServiceClient';
import { UsbmuxdPairRecord } from './UsbmuxdClient';
import { LockdownProtocolClient } from '../protocol/LockdownProtocol';

const debug = Debug('expo:apple-device:client:lockdownd');

export interface DeviceValues {
  BasebandCertId: number;
  BasebandKeyHashInformation: {
    AKeyStatus: number;
    SKeyHash: Buffer;
    SKeyStatus: number;
  };
  BasebandSerialNumber: Buffer;
  BasebandVersion: string;
  BoardId: number;
  BuildVersion: string;
  ChipID: number;
  ConnectionType: 'USB' | 'Network';
  DeviceClass: string;
  DeviceColor: string;
  DeviceName: string;
  DieID: number;
  HardwareModel: string;
  HasSiDP: boolean;
  PartitionType: string;
  ProductName: string;
  ProductType: string;
  ProductVersion: string;
  ProductionSOC: boolean;
  ProtocolVersion: string;
  TelephonyCapability: boolean;
  UniqueChipID: number;
  UniqueDeviceID: string;
  WiFiAddress: string;
  [key: string]: any;
}

interface LockdowndServiceResponse {
  Request: 'StartService';
  Service: string;
  Port: number;
  EnableServiceSSL?: boolean; // Only on iOS 13+
}

interface LockdowndSessionResponse {
  Request: 'StartSession';
  EnableSessionSSL: boolean;
}

interface LockdowndAllValuesResponse {
  Request: 'GetValue';
  Value: DeviceValues;
}

interface LockdowndValueResponse {
  Request: 'GetValue';
  Key: string;
  Value: string;
}

interface LockdowndQueryTypeResponse {
  Request: 'QueryType';
  Type: string;
}

function isLockdowndServiceResponse(resp: any): resp is LockdowndServiceResponse {
  return resp.Request === 'StartService' && resp.Service !== undefined && resp.Port !== undefined;
}

function isLockdowndSessionResponse(resp: any): resp is LockdowndSessionResponse {
  return resp.Request === 'StartSession';
}

function isLockdowndAllValuesResponse(resp: any): resp is LockdowndAllValuesResponse {
  return resp.Request === 'GetValue' && resp.Value !== undefined;
}

function isLockdowndValueResponse(resp: any): resp is LockdowndValueResponse {
  return resp.Request === 'GetValue' && resp.Key !== undefined && typeof resp.Value === 'string';
}

function isLockdowndQueryTypeResponse(resp: any): resp is LockdowndQueryTypeResponse {
  return resp.Request === 'QueryType' && resp.Type !== undefined;
}

export class LockdowndClient extends ServiceClient<LockdownProtocolClient> {
  constructor(public socket: Socket) {
    super(socket, new LockdownProtocolClient(socket));
  }

  async startService(name: string) {
    debug(`startService: ${name}`);

    const resp = await this.protocolClient.sendMessage({
      Request: 'StartService',
      Service: name,
    });

    if (isLockdowndServiceResponse(resp)) {
      return { port: resp.Port, enableServiceSSL: !!resp.EnableServiceSSL };
    } else {
      throw new ResponseError(`Error starting service ${name}`, resp);
    }
  }

  async startSession(pairRecord: UsbmuxdPairRecord) {
    debug(`startSession: ${pairRecord}`);

    const resp = await this.protocolClient.sendMessage({
      Request: 'StartSession',
      HostID: pairRecord.HostID,
      SystemBUID: pairRecord.SystemBUID,
    });

    if (isLockdowndSessionResponse(resp)) {
      if (resp.EnableSessionSSL) {
        this.protocolClient.socket = new tls.TLSSocket(this.protocolClient.socket, {
          secureContext: tls.createSecureContext({
            // Avoid using `secureProtocol` fixing the socket to a single TLS version.
            // Newer Node versions might not support older TLS versions.
            // By using the default `minVersion` and `maxVersion` options,
            // The socket will automatically use the appropriate TLS version.
            // See: https://nodejs.org/api/tls.html#tlscreatesecurecontextoptions
            cert: pairRecord.RootCertificate,
            key: pairRecord.RootPrivateKey,
          }),
        });
        debug(`Socket upgraded to TLS connection`);
      }
      // TODO: save sessionID for StopSession?
    } else {
      throw new ResponseError('Error starting session', resp);
    }
  }

  async getAllValues() {
    debug(`getAllValues`);

    const resp = await this.protocolClient.sendMessage({ Request: 'GetValue' });

    if (isLockdowndAllValuesResponse(resp)) {
      return resp.Value;
    } else {
      throw new ResponseError('Error getting lockdown value', resp);
    }
  }

  async getValue(val: string) {
    debug(`getValue: ${val}`);

    const resp = await this.protocolClient.sendMessage({
      Request: 'GetValue',
      Key: val,
    });

    if (isLockdowndValueResponse(resp)) {
      return resp.Value;
    } else {
      throw new ResponseError('Error getting lockdown value', resp);
    }
  }

  async queryType() {
    debug('queryType');

    const resp = await this.protocolClient.sendMessage({
      Request: 'QueryType',
    });

    if (isLockdowndQueryTypeResponse(resp)) {
      return resp.Type;
    } else {
      throw new ResponseError('Error getting lockdown query type', resp);
    }
  }

  async doHandshake(pairRecord: UsbmuxdPairRecord) {
    debug('doHandshake');

    // if (await this.lockdownQueryType() !== 'com.apple.mobile.lockdown') {
    //   throw new CommandError('Invalid type received from lockdown handshake');
    // }
    // await this.getLockdownValue('ProductVersion');
    // TODO: validate pair and pair
    await this.startSession(pairRecord);
  }
}
