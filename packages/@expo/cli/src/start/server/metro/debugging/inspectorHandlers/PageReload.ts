import type { Protocol } from 'devtools-protocol';

import { CdpMessage, DebuggerMetadata, DebuggerRequest, InspectorHandler } from './types';
import { MetroBundlerDevServer } from '../../MetroBundlerDevServer';

export class PageReloadHandler implements InspectorHandler {
  constructor(private readonly metroBundler: MetroBundlerDevServer) {}

  onDebuggerMessage(message: DebuggerRequest<PageReload>, { socket }: DebuggerMetadata) {
    if (message.method === 'Page.reload') {
      this.metroBundler.broadcastMessage('reload');
      socket.send(JSON.stringify({ id: message.id }));
      return true;
    }

    return false;
  }
}

/** @see https://chromedevtools.github.io/devtools-protocol/1-2/Page/#method-reload */
export type PageReload = CdpMessage<'Page.reload', Protocol.Page.ReloadRequest, never>;
