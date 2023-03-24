import { MetroConfig } from '@expo/metro-config';
import Protocol from 'devtools-protocol';
import type { Server as MetroServer } from 'metro';
import type { DebuggerInfo } from 'metro-inspector-proxy';
import WS from 'ws';

import { Log } from '../../../../../log';
import { CdpMessage, DebuggerRequest, InspectorHandler } from './types';

export class PageReloadHandler implements InspectorHandler {
  constructor(private readonly metroServer: MetroServer) {}

  onDebuggerMessage(
    message: DebuggerRequest<PageReload>,
    { socket }: Pick<DebuggerInfo, 'socket'>
  ) {
    if (message.method === 'Page.reload') {
      const client = new WS(`ws://localhost:19000/message`);
      const command = {
        version: 2,
        method: 'reload',
      };

      client.on('open', () => {
        client.send(JSON.stringify(command), () => {
          client.close();
        });
      });

      if (message.params.ignoreCache) {
        ((this.metroServer as any)._config as MetroConfig).cacheStores.forEach((store) =>
          store.clear()
        );
        Log.log('Metro cache cleared');
      }

      socket.send(JSON.stringify({ id: message.id }));

      return true;
    }

    return false;
  }
}

/** @see https://chromedevtools.github.io/devtools-protocol/1-2/Page/#method-reload */
export type PageReload = CdpMessage<'Page.reload', Protocol.Page.ReloadRequest, never>;
