import connect from 'connect';
import type { MetroConfig } from 'metro';

import { createEventsSocket } from './createEventSocket';
import { createMessagesSocket } from './createMessageSocket';
import { Log } from '../../../../log';

export function createMetroDevMiddleware(metroConfig: MetroConfig) {
  const messages = createMessagesSocket({ logger: Log });
  const events = createEventsSocket(messages);

  const middleware = connect()
    .use(noCacheMiddleware)
    .use('/status', (_req, res) => {
      res.setHeader('X-React-Native-Project-Root', metroConfig.projectRoot!);
      res.end('packager-status:running');
    })
    .use('/reload', (_req, res) => {
      messages.broadcast('reload');
      res.end('OK');
    });

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
