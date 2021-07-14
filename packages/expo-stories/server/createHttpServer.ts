import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import http from 'http';
import ws from 'ws';

import { ServerConfig, StoryHttpServer } from '../types';
import { getStories } from './shared';

function createHttpServer(config: ServerConfig): StoryHttpServer {
  const app = express();

  app.use(bodyParser.json());
  app.use(cors());

  const server = http.createServer(app);
  const wss = new ws.Server({ server });

  app.get('/stories', (req, res) => {
    const stories = getStories(config);
    res.json({ data: stories });
  });

  app.post(`/stories`, (req, res) => {
    const { type, payload } = req.body;

    if (type === 'selectStory') {
      // TODO
      // const storyId: string = payload;
      // const selectedStory = storiesById[storyId];
      // if (selectedStory) {
      //   wss.clients.forEach(client => {
      //     if (client.readyState === ws.OPEN) {
      //     }
      //   });
      //   res.json({ data: selectedStory });
      // return;
      // }
    }

    if (type === 'clearStory') {
      wss.clients.forEach(client => {
        if (client.readyState === ws.OPEN) {
          // TODO
          // const event = {
          //   type: 'clearStory',
          // };
          // client.send(JSON.stringify(event));
        }
      });

      res.json({ data: 'Cleared story' });
      return;
    }

    res.json({ data: 'Invalid story id provided!' });
  });

  function start() {
    const { port } = config;
    server.listen(port, () => {
      console.log(`Listening on http://localhost:${port}`);
    });
  }

  function refreshClients() {
    // TODO
    wss.clients.forEach(client => {
      if (client.readyState === ws.OPEN) {
        // const message = JSON.stringify({
        //   type: 'refreshStories',
        //   payload: undefined,
        // });
        // client.send(message);
      }
    });
  }

  function cleanup() {
    server.close();
    wss.close();
  }

  server.on('close', cleanup);
  server.on('error', cleanup);

  return {
    start,
    refreshClients,
    cleanup,
  };
}

export { createHttpServer };
