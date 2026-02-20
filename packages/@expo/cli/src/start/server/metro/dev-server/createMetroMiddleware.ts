import type { MetroConfig } from '@expo/metro/metro';
import connect from 'connect';
import { Body } from 'fetch-nodeshim';

import { compression } from './compression';
import { createEventsSocket } from './createEventSocket';
import { createMessagesSocket } from './createMessageSocket';
import { Log } from '../../../../log';
import { openInEditorAsync } from '../../../../utils/editor';

export function createMetroMiddleware(metroConfig: Pick<MetroConfig, 'projectRoot'>) {
  const messages = createMessagesSocket({ logger: Log });
  const events = createEventsSocket(messages);

  const middleware = connect()
    .use(noCacheMiddleware)
    .use(compression)
    // Support opening stack frames from clients directly in the editor
    .use('/open-stack-frame', metroOpenStackFrameMiddleware)
    // Support status check to detect if the packager needs to be started from the native side
    .use('/status', createMetroStatusMiddleware(metroConfig));

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

const noCacheMiddleware: connect.NextHandleFunction = (req, res, next) => {
  res.setHeader('Surrogate-Control', 'no-store');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
};

const metroOpenStackFrameMiddleware: connect.NextHandleFunction = async (req, res, next) => {
  if (req.method !== 'POST') {
    return next();
  }
  try {
    const frame = await new Body(req).json();
    await openInEditorAsync(frame.file, frame.lineNumber);
    return res.end('OK');
  } catch {
    res.statusCode = 400;
    return res.end('Open stack frame requires the JSON stack frame as request body');
  }
};

function createMetroStatusMiddleware(
  metroConfig: Pick<MetroConfig, 'projectRoot'>
): connect.NextHandleFunction {
  return (_req, res) => {
    res.setHeader('X-React-Native-Project-Root', encodeURI(metroConfig.projectRoot!));
    res.end('packager-status:running');
  };
}
