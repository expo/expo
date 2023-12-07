import type { Protocol } from 'devtools-protocol';
import fetch, { Response } from 'node-fetch';

import {
  CdpMessage,
  DebuggerMetadata,
  DebuggerRequest,
  DeviceResponse,
  InspectorHandler,
} from './types';
import { respond } from './utils';

export class NetworkLoadResourceHandler implements InspectorHandler {
  private streamIdCounter = 1;
  private networkResources = new Map<string, Response | null>();

  get streamId() {
    return `stream-${this.streamIdCounter++}`;
  }

  onDebuggerMessage(
    message:
      | DebuggerRequest<LoadNetworkResource>
      | DebuggerRequest<IORead>
      | DebuggerRequest<IOClose>,
    { socket }: DebuggerMetadata
  ) {
    // Execute a fetch call, and respond to the Network.loadNetworkResource event when its done
    if (message.method === 'Network.loadNetworkResource') {
      fetch(message.params.url).then((response) => {
        const streamId = this.streamId;

        this.networkResources.set(streamId, response);

        respond<DeviceResponse<LoadNetworkResource>>(socket, {
          id: message.id,
          result: {
            resource: {
              success: response.ok,
              httpStatusCode: response.status,
              stream: streamId,
              headers: Object.fromEntries(response.headers.entries()),
            },
          },
        });
      });

      return true;
    }

    // Read the body, and just send it through
    if (message.method === 'IO.read') {
      const streamId = message.params.handle;
      const response = this.networkResources.get(streamId);

      if (response === undefined) {
        console.warn('Could not decode the response body, no stream id available');
        return true;
      }

      if (response === null) {
        return respond<DeviceResponse<IORead>>(socket, {
          id: message.id,
          result: {
            base64Encoded: false,
            data: '',
            eof: true,
          },
        });
      } else {
        response.text().then((body) => {
          respond<DeviceResponse<IORead>>(socket, {
            id: message.id,
            result: {
              base64Encoded: false,
              data: body,
              eof: false,
            },
          });
        });

        this.networkResources.set(streamId, null);
      }

      return true;
    }

    if (message.method === 'IO.close') {
      const streamId = message.params.handle;

      if (this.networkResources.has(streamId)) {
        this.networkResources.delete(streamId);
      }

      return respond<DeviceResponse<IOClose>>(socket, {
        id: message.id,
        result: {},
      });
    }

    return false;
  }
}

/** @see https://cdpstatus.reactnative.dev/devtools-protocol/tot/Network#method-loadNetworkResource */
export type LoadNetworkResource = CdpMessage<
  'Network.loadNetworkResource',
  Protocol.Network.LoadNetworkResourceRequest,
  Protocol.Network.LoadNetworkResourceResponse
>;

/** @see https://cdpstatus.reactnative.dev/devtools-protocol/tot/IO#method-read */
export type IORead = CdpMessage<'IO.read', Protocol.IO.ReadRequest, Protocol.IO.ReadResponse>;

/** @see https://cdpstatus.reactnative.dev/devtools-protocol/tot/IO#method-close */
export type IOClose = CdpMessage<'IO.close', Protocol.IO.CloseRequest, {}>;
