import type { MetroConfig } from '@bycedric/metro/metro';
import connect from 'connect';

import { createEventsSocket } from './createEventSocket';
import { createMessagesSocket } from './createMessageSocket';
import { Log } from '../../../../log';
import { openInEditorAsync } from '../../../../utils/editor';

const compression = require('compression');

export function createMetroMiddleware(metroConfig: Pick<MetroConfig, 'projectRoot'>) {
  const messages = createMessagesSocket({ logger: Log });
  const events = createEventsSocket(messages);

  const middleware = connect()
    .use(noCacheMiddleware)
    .use(compression())
    // Support opening stack frames from clients directly in the editor
    .use('/open-stack-frame', rawBodyMiddleware)
    .use('/open-stack-frame', metroOpenStackFrameMiddleware)
    // Support the symbolication endpoint of Metro
    // See: https://github.com/facebook/metro/blob/a792d85ffde3c21c3fbf64ac9404ab0afe5ff957/packages/metro/src/Server.js#L1266
    .use('/symbolicate', rawBodyMiddleware)
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

const rawBodyMiddleware: connect.NextHandleFunction = (req, _res, next) => {
  const reqWithBody = req as typeof req & { rawBody: string };
  reqWithBody.setEncoding('utf8');
  reqWithBody.rawBody = '';
  reqWithBody.on('data', (chunk) => (reqWithBody.rawBody += chunk));
  reqWithBody.on('end', next);
};

const metroOpenStackFrameMiddleware: connect.NextHandleFunction = (req, res, next) => {
  // Only accept POST requests
  if (req.method !== 'POST') return next();
  // Only handle requests with a raw body
  if (!('rawBody' in req) || !req.rawBody) {
    res.statusCode = 406;
    return res.end('Open stack frame requires the JSON stack frame as request body');
  }

  const frame = JSON.parse(req.rawBody as string);
  openInEditorAsync(frame.file, frame.lineNumber).finally(() => res.end('OK'));
};

function createMetroStatusMiddleware(
  metroConfig: Pick<MetroConfig, 'projectRoot'>
): connect.NextHandleFunction {
  return (_req, res) => {
    res.setHeader('X-React-Native-Project-Root', metroConfig.projectRoot!);
    res.end('packager-status:running');
  };
}
