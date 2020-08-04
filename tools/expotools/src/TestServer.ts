import bodyParser from 'body-parser';
import { spawn } from 'child_process';
import express from 'express';
import fs from 'fs';
import path from 'path';
import spawnAsync from '@expo/spawn-async';

import * as Directories from './Directories';
import * as Fixtures from './Fixtures';
import { sleepAsync } from './Utils';

function _urlSafeId(): string {
  let text = '';
  let possible = 'abcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < 7; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
}

export async function startLocalServerAsync(): Promise<void> {
  await spawnAsync('./setup-network-proxy.sh', [], {
    stdio: 'inherit',
    cwd: Directories.getBinDir(),
  });
  let hotelBin = path.join(require.resolve('hotel/package.json'), '..', 'lib', 'cli', 'bin.js');
  await spawnAsync(hotelBin, ['start'], {
    stdio: 'inherit',
  });
  await spawnAsync(hotelBin, ['add', 'http://localhost:3013', '-n', 'expo-test-server'], {
    stdio: 'inherit',
  });

  let username = process.env.USER || _urlSafeId();
  await startServerAsync(`expo-test-server.${username}`, true);
}

export async function startServerAsync(
  hostname: string,
  startNgrok: boolean = false
): Promise<void> {
  var app = express();
  app.use(bodyParser.json());

  let fixtureServers = {};

  app.get('/expo-test-server-status', (req, res) => {
    res.send('running!');
  });

  app.post('/report-test-result', (req, res) => {
    console.log('report-test-result body: ' + JSON.stringify(req.body));
  });

  app.get('/start-fixture-server', async (req, res) => {
    let fixtureName = req.query.fixtureName;
    if (!fixtureName) {
      res.status(400).send('Must pass a fixtureName query param');
      return;
    }

    let fixtureFilePath = path.join(
      Directories.getExpotoolsDir(),
      'fixtures',
      `${fixtureName}.fixture`
    );
    if (!fs.existsSync(fixtureFilePath)) {
      res.status(400).send(`Fixture ${fixtureName} does not exist`);
      return;
    }
    res.setHeader('Content-Type', 'application/json');

    let id = _urlSafeId();
    let host = `${id}.${hostname}`;
    let manifestServerUrl = `manifest-${host}`;
    let packagerServerUrl = `packager-${host}`;
    let killNgrokFn: (() => void) | null = null;

    if (startNgrok) {
      let ngrokProcess1 = spawn('ngrok', ['http', `-subdomain=${manifestServerUrl}`, '3013']);
      let ngrokProcess2 = spawn('ngrok', ['http', `-subdomain=${packagerServerUrl}`, '3013']);

      killNgrokFn = () => {
        ngrokProcess1.kill();
        ngrokProcess2.kill();
      };

      manifestServerUrl = `${manifestServerUrl}.ngrok.io`;
      packagerServerUrl = `${packagerServerUrl}.ngrok.io`;

      // Wait for ngrok to start. Only used in development so fine if this
      // fails sometimes.
      await sleepAsync(5000);
    }

    let { requestHandler, testEvents } = await Fixtures.getFixtureServerRequestHandlerAsync(
      fixtureFilePath,
      manifestServerUrl,
      packagerServerUrl,
      1.0,
      true,
      () => {
        delete fixtureServers[id];
        fixtureServers[id] = null;
        if (killNgrokFn) {
          killNgrokFn();
        }
      }
    );

    fixtureServers[id] = requestHandler;

    res.json({
      manifestServerUrl: `exp://${manifestServerUrl}`,
      testEvents,
    });
  });

  app.all('*', (req, res) => {
    let host = req.hostname;
    let subdomain = host.split('.')[0];
    if (!subdomain.startsWith('manifest-') && !subdomain.startsWith('packager-')) {
      res.status(400).send('Invalid subdomain');
      return;
    }

    let serverType = subdomain.split('-')[0];
    let id = subdomain.split('-')[1];
    if (!id) {
      res.status(400).send('Invalid subdomain');
      return;
    }

    if (!fixtureServers[id]) {
      res.status(400).send(`No server found for ID ${id}`);
      return;
    }

    fixtureServers[id](serverType, req, res);
  });

  app.listen(3013);
}
