/**
 * Copyright (c) 2021 Expo, Inc.
 * Copyright (c) 2018 Drifty Co.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { Socket } from 'net';
import * as path from 'path';

import { ServiceClient } from './ServiceClient';
import { GDBProtocolClient } from '../protocol/GDBProtocol';

export class DebugserverClient extends ServiceClient<GDBProtocolClient> {
  constructor(public socket: Socket) {
    super(socket, new GDBProtocolClient(socket));
  }

  async setMaxPacketSize(size: number) {
    return this.sendCommand('QSetMaxPacketSize:', [size.toString()]);
  }

  async setWorkingDir(workingDir: string) {
    return this.sendCommand('QSetWorkingDir:', [workingDir]);
  }

  async checkLaunchSuccess() {
    return this.sendCommand('qLaunchSuccess', []);
  }

  async attachByName(name: string) {
    const hexName = Buffer.from(name).toString('hex');
    return this.sendCommand(`vAttachName;${hexName}`, []);
  }

  async continue() {
    return this.sendCommand('c', []);
  }

  halt() {
    // ^C
    return this.protocolClient.socket.write('\u0003');
  }

  async kill() {
    const msg: any = { cmd: 'k', args: [] };
    return this.protocolClient.sendMessage(msg, (resp: string, resolve: any) => {
      this.protocolClient.socket.write('+');
      const parts = resp.split(';');
      for (const part of parts) {
        if (part.includes('description') && part.includes(':')) {
          // description:{hex encoded message like: "Terminated with signal 9"}
          resolve(Buffer.from(part.split(':')[1]!, 'hex').toString('ascii'));
        }
      }
    });
  }

  // TODO support app args
  // https://sourceware.org/gdb/onlinedocs/gdb/Packets.html#Packets
  // A arglen,argnum,arg,
  async launchApp(appPath: string, executableName: string) {
    const fullPath = path.join(appPath, executableName);
    const hexAppPath = Buffer.from(fullPath).toString('hex');
    const appCommand = `A${hexAppPath.length},0,${hexAppPath}`;
    return this.sendCommand(appCommand, []);
  }

  async sendCommand(cmd: string, args: string[]) {
    const msg = { cmd, args };
    const resp = await this.protocolClient.sendMessage(msg);
    // we need to ACK as well
    this.protocolClient.socket.write('+');
    return resp;
  }
}
