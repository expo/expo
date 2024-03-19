import type { Protocol } from 'devtools-protocol';

import type { MetroBundlerDevServer } from '../../MetroBundlerDevServer';
import { MessageHandler } from '../MessageHandler';
import type { CdpMessage, Connection, DebuggerRequest } from '../types';

export class PageReloadHandler extends MessageHandler {
  private metroBundler: MetroBundlerDevServer;

  constructor(connection: Connection, metroBundler: MetroBundlerDevServer) {
    super(connection);
    this.metroBundler = metroBundler;
  }

  handleDebuggerMessage(message: DebuggerRequest<PageReload>) {
    if (message.method === 'Page.reload') {
      this.metroBundler.broadcastMessage('reload');
      return this.sendToDebugger({ id: message.id });
    }

    return false;
  }
}

/** @see https://chromedevtools.github.io/devtools-protocol/1-2/Page/#method-reload */
export type PageReload = CdpMessage<'Page.reload', Protocol.Page.ReloadRequest, never>;
