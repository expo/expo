import type { Protocol } from 'devtools-protocol';
import fs from 'fs';
import type { DebuggerInfo, Device as MetroDevice } from 'metro-inspector-proxy';
import fetch from 'node-fetch';
import path from 'path';

import { CdpMessage, DebuggerRequest, InspectorHandler } from './types';
import { errorMessage, respond } from './utils';

export class DebuggerScriptSource implements InspectorHandler {
  constructor(private readonly device: MetroDevice) {}

  onDebuggerMessage(
    message: DebuggerRequest<DebuggerGetScriptSource>,
    { socket }: Pick<DebuggerInfo, 'socket'>
  ) {
    // See: https://github.com/facebook/metro/blob/65d801cb60c06c1b17f428ca79491db73c53ef87/packages/metro-inspector-proxy/src/Device.js#L488-L544
    if (message.method === 'Debugger.getScriptSource') {
      const { scriptId } = message.params;
      const pathOrUrl = this.device._scriptIdToSourcePathMapping.get(scriptId);

      // Unkown scriptId provided, can't reply
      if (!pathOrUrl) {
        return false;
      }

      // Fetch the source from URL, if the path is a bundle URL
      if (isUrl(pathOrUrl)) {
        fetch(pathOrUrl)
          .then((response) =>
            response.ok
              ? response.text()
              : respond(socket, message, {
                  error: `Received status ${response.status} while fetching: ${pathOrUrl}`,
                })
          )
          .then((scriptSource) => {
            if (scriptSource !== null) {
              respond(socket, message, { scriptSource });
            }
          });

        return true;
      }

      // Fetch the source from file directly, using the project root as starting directory
      try {
        const relativePath = path.resolve(this.device._projectRoot, pathOrUrl);
        respond(socket, message, { scriptSource: fs.readFileSync(relativePath, 'utf8') });
      } catch (error: unknown) {
        respond(socket, message, {
          error: `Failed to load "${pathOrUrl}": ${errorMessage(error)}`,
        });
      }

      return true;
    }

    return false;
  }
}

/** @see https://chromedevtools.github.io/devtools-protocol/v8/Debugger/#method-getScriptSource */
export type DebuggerGetScriptSource = CdpMessage<
  'Debugger.getScriptSource',
  Protocol.Debugger.GetScriptSourceRequest,
  Protocol.Debugger.GetScriptSourceResponse
>;

function isUrl(pathOrUrl: string) {
  try {
    const url = new URL(pathOrUrl);
    return ['http', 'https'].some((protocol) => url.protocol.toLowerCase().startsWith(protocol));
  } catch {
    return false;
  }
}
