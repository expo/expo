import { getMetroServerRoot } from '@expo/config/paths';
import type { MetroConfig } from '@expo/metro/metro';
import type MetroBundler from '@expo/metro/metro/Bundler';
import connect from 'connect';
import { Body } from 'fetch-nodeshim';
import fs from 'node:fs';
import path from 'node:path';

import { compression } from './compression';
import { createEventsSocket } from './createEventSocket';
import { createMessagesSocket } from './createMessageSocket';
import { Log } from '../../../../log';
import { openInEditorAsync } from '../../../../utils/editor';

interface MetroMiddlewareOptions {
  getMetroBundler(): MetroBundler;
}

interface StackFrame {
  file: string;
  lineNumber?: number | undefined;
}

export function createMetroMiddleware(
  metroConfig: Pick<MetroConfig, 'projectRoot'>,
  options: MetroMiddlewareOptions
) {
  const messages = createMessagesSocket({ logger: Log });
  const events = createEventsSocket(messages);

  const middleware = connect()
    .use(noCacheMiddleware)
    .use(compression)
    // Support opening stack frames from clients directly in the editor
    .use('/open-stack-frame', createMetroOpenStackFrameMiddleware(metroConfig))
    // Support status check to detect if the packager needs to be started from the native side
    .use('/status', createMetroStatusMiddleware(metroConfig, options));

  return {
    middleware,
    messagesSocket: messages,
    eventsSocket: events,
    websocketEndpoints: {
      [messages.endpoint]: messages.server,
      [events.endpoint]: events.server,
    },
  };
}

const noCacheMiddleware: connect.NextHandleFunction = (_req, res, next) => {
  res.setHeader('Surrogate-Control', 'no-store');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
};

function createMetroStatusMiddleware(
  metroConfig: Pick<MetroConfig, 'projectRoot'>,
  options: MetroMiddlewareOptions
): connect.NextHandleFunction {
  return async (_req, res) => {
    res.setHeader('X-React-Native-Project-Root', encodeURI(metroConfig.projectRoot!));
    res.flushHeaders();
    await options.getMetroBundler().ready();
    res.end('packager-status:running');
  };
}

function createMetroOpenStackFrameMiddleware(
  metroConfig: Pick<MetroConfig, 'projectRoot'>
): connect.NextHandleFunction {
  return async (req, res, next) => {
    if (req.method !== 'POST') {
      return next();
    }

    let frame: StackFrame | undefined;
    try {
      const json = await new Body(req).json();
      if (typeof json === 'object' && json != null && typeof json.file === 'string') {
        frame = {
          file: json.file,
          lineNumber:
            typeof json.lineNumber === 'number' && Number.isSafeInteger(json.lineNumber)
              ? json.lineNumber
              : undefined,
        };
      }
    } catch {}
    if (!frame) {
      res.statusCode = 400;
      return res.end('Open stack frame requires the JSON stack frame as request body');
    }

    const root = getMetroServerRoot(metroConfig.projectRoot!);
    const file = await ensureFileInRootDirectory(root, frame.file);
    if (!file) {
      res.statusCode = 400;
      return res.end('Open stack frame requires target file to be in server root');
    }

    try {
      await openInEditorAsync(file, frame.lineNumber);
      return res.end('OK');
    } catch {
      res.statusCode = 5006;
      return res.end('Open stack frame failed to open local editor');
    }
  };
}

const ensureFileInRootDirectory = async (root: string, file: string): Promise<string | null> => {
  try {
    file = path.resolve(root, file);
    file = await fs.promises.realpath(file);
    // Cannot be accessed using Metro's server API, we need to move the file
    // into the project root and try again.
    if (!path.relative(root, file).startsWith('..' + path.sep)) {
      return file;
    } else {
      return null;
    }
  } catch {
    return null;
  }
};
