/**
 * Copyright (c) 2021 Expo, Inc.
 * Copyright (c) 2018 Drifty Co.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type * as net from 'net';
import { Duplex } from 'stream';
import * as tls from 'tls';

import type { ServiceClient } from './client';
import { AFCClient } from './client/afc';
import { DebugserverClient } from './client/debugserver';
import { InstallationProxyClient } from './client/installation_proxy';
import { LockdowndClient } from './client/lockdownd';
import { MobileImageMounterClient } from './client/mobile_image_mounter';
import type { UsbmuxdDevice, UsbmuxdPairRecord } from './client/usbmuxd';
import { UsbmuxdClient } from './client/usbmuxd';

export class ClientManager {
  private connections: net.Socket[];
  constructor(
    public pairRecord: UsbmuxdPairRecord,
    public device: UsbmuxdDevice,
    private lockdowndClient: LockdowndClient
  ) {
    this.connections = [lockdowndClient.socket];
  }

  static async create(udid?: string) {
    const usbmuxClient = new UsbmuxdClient(UsbmuxdClient.connectUsbmuxdSocket());
    const device = await usbmuxClient.getDevice(udid);
    const pairRecord = await usbmuxClient.readPairRecord(device.Properties.SerialNumber);
    const lockdownSocket = await usbmuxClient.connect(device, 62078);
    const lockdownClient = new LockdowndClient(lockdownSocket);
    await lockdownClient.doHandshake(pairRecord);
    return new ClientManager(pairRecord, device, lockdownClient);
  }

  async getUsbmuxdClient() {
    const usbmuxClient = new UsbmuxdClient(UsbmuxdClient.connectUsbmuxdSocket());
    this.connections.push(usbmuxClient.socket);
    return usbmuxClient;
  }

  async getLockdowndClient() {
    const usbmuxClient = new UsbmuxdClient(UsbmuxdClient.connectUsbmuxdSocket());
    const lockdownSocket = await usbmuxClient.connect(this.device, 62078);
    const lockdownClient = new LockdowndClient(lockdownSocket);
    this.connections.push(lockdownClient.socket);
    return lockdownClient;
  }

  async getLockdowndClientWithHandshake() {
    const lockdownClient = await this.getLockdowndClient();
    await lockdownClient.doHandshake(this.pairRecord);
    return lockdownClient;
  }

  async getAFCClient() {
    return this.getServiceClient('com.apple.afc', AFCClient);
  }

  async getInstallationProxyClient() {
    return this.getServiceClient('com.apple.mobile.installation_proxy', InstallationProxyClient);
  }

  async getMobileImageMounterClient() {
    return this.getServiceClient('com.apple.mobile.mobile_image_mounter', MobileImageMounterClient);
  }

  async getDebugserverClient() {
    try {
      // iOS 14 added support for a secure debug service so try to connect to that first
      return await this.getServiceClient(
        'com.apple.debugserver.DVTSecureSocketProxy',
        DebugserverClient
      );
    } catch {
      // otherwise, fall back to the previous implementation
      return this.getServiceClient('com.apple.debugserver', DebugserverClient, true);
    }
  }

  private async getServiceClient<T extends ServiceClient<any>>(
    name: string,
    ServiceType: new (...args: any[]) => T,
    disableSSL = false
  ) {
    const { port: servicePort, enableServiceSSL } = await this.lockdowndClient.startService(name);
    const usbmuxClient = new UsbmuxdClient(UsbmuxdClient.connectUsbmuxdSocket());
    let usbmuxdSocket = await usbmuxClient.connect(this.device, servicePort);

    if (enableServiceSSL) {
      const tlsOptions: tls.ConnectionOptions = {
        rejectUnauthorized: false,
        secureContext: tls.createSecureContext({
          secureProtocol: 'TLSv1_method',
          cert: this.pairRecord.RootCertificate,
          key: this.pairRecord.RootPrivateKey,
        }),
      };

      // Some services seem to not support TLS/SSL after the initial handshake
      // More info: https://github.com/libimobiledevice/libimobiledevice/issues/793
      if (disableSSL) {
        // According to https://nodejs.org/api/tls.html#tls_tls_connect_options_callback we can
        // pass any Duplex in to tls.connect instead of a Socket. So we'll use our proxy to keep
        // the TLS wrapper and underlying usbmuxd socket separate.
        const proxy: any = new UsbmuxdProxy(usbmuxdSocket);
        tlsOptions.socket = proxy;

        await new Promise<void>((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error('The TLS handshake failed to complete after 5s.'));
          }, 5000);
          tls.connect(tlsOptions, function (this: tls.TLSSocket) {
            clearTimeout(timeoutId);
            // After the handshake, we don't need TLS or the proxy anymore,
            // since we'll just pass in the naked usbmuxd socket to the service client
            this.destroy();
            resolve();
          });
        });
      } else {
        tlsOptions.socket = usbmuxdSocket;
        usbmuxdSocket = tls.connect(tlsOptions);
      }
    }
    const client = new ServiceType(usbmuxdSocket);
    this.connections.push(client.socket);
    return client;
  }

  end() {
    for (const socket of this.connections) {
      // may already be closed
      try {
        socket.end();
      } catch (err) {
        // ignore
      }
    }
  }
}

class UsbmuxdProxy extends Duplex {
  constructor(private usbmuxdSock: net.Socket) {
    super();

    this.usbmuxdSock.on('data', data => {
      this.push(data);
    });
  }

  _write(chunk: any, encoding: string, callback: (err?: Error) => void) {
    this.usbmuxdSock.write(chunk);
    callback();
  }

  _read(size: number) {
    // Stub so we don't error, since we push everything we get from usbmuxd as it comes in.
    // TODO: better way to do this?
  }

  _destroy() {
    this.usbmuxdSock.removeAllListeners();
  }
}
