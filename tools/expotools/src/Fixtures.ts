import base64 from 'base-64';
import concat from 'concat-stream';
import connect from 'connect';
import freeportAsync from 'freeport-async';
import fs from 'fs';
import http from 'http';
import httpProxy from 'http-proxy';
import indentString from 'indent-string';
import inquirer from 'inquirer';
import ip from 'ip';
import net from 'net';
import nullthrows from 'nullthrows';
import qrcodeTerminal from 'qrcode-terminal';
import enableDestroy from 'server-destroy';
import transformerProxy from 'transformer-proxy';
import WebSocket from 'ws';
import { Api, Exp, ProjectSettings, UrlUtils, UserManager } from '@expo/xdl';
import spawnAsync from '@expo/spawn-async';

import { sleepAsync } from './Utils';

type FixtureServer = 'manifest' | 'packager' | 'tests';

enum FixtureType {
  HTTP_REQUEST = 'httpRequest',
  HTTP_RESPONSE = 'httpResponse',
  WS_UPGRADE = 'wsUpgrade',
  WS_OPEN = 'wsOpen',
  WS_INBOUND = 'wsInbound',
  WS_OUTBOUND = 'wsOutbound',
  WS_CLOSED = 'wsClosed',
  FIND_TEXT_ON_SCREEN = 'findTextOnScreen',
}

const DEBUGGER_HOST_PLACEHOLDER = 'EXPO_FIXTURE_SERVER_DEBUGGER_HOST_PLACEHOLDER';
const MANIFEST_URL_PLACEHOLDER = 'EXPO_FIXTURE_SERVER_MANIFEST_URL_PLACEHOLDER';
const PLAYBACK_SERVER_TIMEOUT = 30 * 1000;

let _outputFilePath: string | null = null;
let _initialTimeMs: number | null = null;
let _testEventId = 0;

async function _loginAsCorrectUserAsync(): Promise<void> {
  const username = process.env.EXPO_HOME_DEV_ACCOUNT_USERNAME;
  if (!username) {
    throw new Error('EXPO_HOME_DEV_ACCOUNT_USERNAME must be set in your environment.');
  }
  const password = process.env.EXPO_HOME_DEV_ACCOUNT_PASSWORD;
  if (!password) {
    throw new Error('EXPO_HOME_DEV_ACCOUNT_PASSWORD must be set in your environment.');
  }

  await UserManager.loginAsync('user-pass', {
    username,
    password,
  });
}

async function _rewriteManifestAsync(
  publishInfo: unknown,
  req: http.IncomingMessage,
  data: string | Buffer,
  originalDebuggerHost: string,
  newDebuggerHost: string,
  originalManifestUrl: string,
  newManifestUrl: string
): Promise<any> {
  if (!nullthrows(req.url).includes('index.exp')) {
    return data;
  }

  let isSigned = !!(
    req.headers['expo-accept-signature'] || req.headers['exponent-accept-signature']
  );
  let result = data.toString();

  if (isSigned) {
    result = JSON.parse(result).manifestString;
  }
  result = result
    .replace(new RegExp(originalDebuggerHost, 'g'), newDebuggerHost)
    .replace(new RegExp(originalManifestUrl, 'g'), newManifestUrl);
  if (!isSigned) {
    return result;
  }
  let signedManifest = await Api.callMethodAsync(
    'signManifest',
    [publishInfo],
    'post',
    JSON.parse(result)
  );
  return signedManifest.response;
}

export async function startRecordingAsync(
  projectRoot: string,
  promptForTextToFind: boolean = true,
  outputFilePath: string = 'fixtures.txt'
): Promise<void> {
  await _loginAsCorrectUserAsync();

  // TODO: thread this through to everything that needs it?
  _outputFilePath = outputFilePath;

  let packagerInfo = await ProjectSettings.readPackagerInfoAsync(projectRoot);
  if (!packagerInfo.packagerPort) {
    throw new Error(`No packager found for project at ${projectRoot}.`);
  }
  if (!packagerInfo.expoServerPort) {
    throw new Error(`No Expo server found for project at ${projectRoot}.`);
  }

  try {
    await spawnAsync('adb', ['shell', 'pm', 'clear', 'host.exp.exponent']);
  } catch (e) {
    console.warn(`Please run 'adb shell pm clear host.exp.exponent' before recording a fixture`);
  }

  let originalDebuggerHost = await UrlUtils.constructDebuggerHostAsync(projectRoot);
  let originalManifestUrl = await UrlUtils.constructUrlAsync(
    projectRoot,
    {
      urlType: 'no-protocol',
    },
    false
  );

  let packagerProxyPort = 5050;
  let manifestProxyPort = 5051;
  let lanAddress = ip.address();
  let newDebuggerHost = `${lanAddress}:${packagerProxyPort}`;
  let newManifestUrl = `${lanAddress}:${manifestProxyPort}`;

  console.log(`Will replace all instances of:`);
  console.log(`  ${originalDebuggerHost} with ${newDebuggerHost}`);
  console.log(`  ${originalManifestUrl} with ${newManifestUrl}\n`);

  fs.writeFileSync(outputFilePath, '');
  let currentRequestId = 0;

  // Manifest proxy
  let manifestProxy = httpProxy.createProxyServer({
    target: `http://localhost:${packagerInfo.expoServerPort}`,
  });

  manifestProxy.on('proxyReq', function (proxyReq, req, res, options) {
    console.log(`Got manifest request: ${req.url}`);
    proxyReq.removeHeader('if-none-match');
    req._expoRequestId = currentRequestId++;
    _writeFixtureDataAsync(req._expoRequestId, 'manifest', FixtureType.HTTP_REQUEST, req.url!, '');
  });

  manifestProxy.on('proxyRes', (proxyRes, req, res) => {
    console.log(`Got manifest response: ${req.url}`);
  });

  let manifestProxyServer = connect();
  manifestProxyServer.use(
    transformerProxy(async (data, req, res) => {
      let publishInfo = (await Exp.getPublishInfoAsync(projectRoot)).args;
      let response = await _rewriteManifestAsync(
        publishInfo,
        req,
        data,
        originalDebuggerHost,
        newDebuggerHost,
        originalManifestUrl,
        newManifestUrl
      );
      let fixtureResponse = await _rewriteManifestAsync(
        publishInfo,
        req,
        data,
        originalDebuggerHost,
        DEBUGGER_HOST_PLACEHOLDER,
        originalManifestUrl,
        MANIFEST_URL_PLACEHOLDER
      );
      _writeFixtureDataAsync(
        req._expoRequestId,
        'manifest',
        FixtureType.HTTP_RESPONSE,
        req.url,
        base64.encode(fixtureResponse),
        res.getHeaders(),
        res.statusCode,
        {
          publishInfo,
        }
      );
      return response;
    })
  );

  manifestProxyServer.use(function (req, res) {
    manifestProxy.web(req, res);
  });
  http.createServer(manifestProxyServer).listen(manifestProxyPort);

  // Packager proxy
  let packagerProxy = httpProxy.createProxyServer({
    target: {
      host: 'localhost',
      port: `${packagerInfo.packagerPort}`,
    },
  });

  packagerProxy.on('proxyReq', (proxyReq, req, res, options) => {
    console.log(`Got packager request: ${req.url}`);
    req._expoRequestId = currentRequestId++;
    _writeFixtureDataAsync(
      req._expoRequestId,
      'packager',
      FixtureType.HTTP_REQUEST,
      nullthrows(req.url),
      ''
    );
  });

  packagerProxy.on('proxyReqWs', (proxyReq, req, res, options) => {
    console.log(`Got packager WebSocket request: ${req.url}`);
    req._expoRequestId = currentRequestId++;
    _writeFixtureDataAsync(
      req._expoRequestId,
      'packager',
      FixtureType.WS_INBOUND,
      nullthrows(req.url),
      ''
    );
  });

  packagerProxy.on('proxyRes', (proxyRes, req, res) => {
    console.log(`Got packager response: ${req.url}`);
    _recordHTTPStream(
      nullthrows(req._expoRequestId),
      'packager',
      FixtureType.HTTP_RESPONSE,
      nullthrows(req.url),
      proxyRes,
      res
    );
  });

  // @ts-ignore
  packagerProxy.on('open', (proxySocket) => {
    console.log('WebSocket opened');
    _writeFixtureDataAsync(currentRequestId++, 'packager', FixtureType.WS_OPEN, '', '');

    // Listen for messages coming FROM the target here
    proxySocket.on('data', (message) => {
      console.log('Packager sent outbound WebSocket message');
      _writeFixtureDataAsync(
        currentRequestId++,
        'packager',
        FixtureType.WS_OUTBOUND,
        '',
        message.toString('base64')
      );
    });
  });

  packagerProxy.on('close', function (res, socket, head) {
    // View disconnected WebScoket connections
    console.log('WebSocket disconnected');
    _writeFixtureDataAsync(currentRequestId++, 'packager', FixtureType.WS_CLOSED, '', '');
  });

  let packagerProxyServer = connect();
  packagerProxyServer.use(function (req, res) {
    packagerProxy.web(req, res);
  });
  http
    .createServer(packagerProxyServer)
    .on('upgrade', function (req, socket, head) {
      console.log('Got WebSocket upgrade');
      packagerProxy.ws(req, socket, head);
      _writeFixtureDataAsync(currentRequestId++, 'packager', FixtureType.WS_UPGRADE, '', '');
    })
    .listen(packagerProxyPort);

  // Print out URL
  qrcodeTerminal.generate(`exp://${newManifestUrl}`, (code) =>
    console.log(`${indentString(code, 2)}\n`)
  );
  console.log(`Your proxy URL is: exp://${newManifestUrl}\n`);
  console.log(`Fixture file will be saved at: ${outputFilePath}`);

  if (!promptForTextToFind) {
    return;
  }

  while (true) {
    // @ts-ignore: the inferred return type is an empty object
    const { verifyTextOnScreen } = await inquirer.prompt([
      {
        type: 'input',
        name: 'verifyTextOnScreen',
        message: 'Text to find at this point:',
      },
    ]);

    recordFindTextOnScreenEvent(verifyTextOnScreen);
  }
}

export async function recordFindTextOnScreenEvent(text: string) {
  _writeFixtureDataAsync(-1, 'tests', FixtureType.FIND_TEXT_ON_SCREEN, '', text);
}

function _recordHTTPStream(
  requestId: number,
  server: FixtureServer,
  type: FixtureType,
  path: string,
  proxyRes: http.IncomingMessage,
  res: http.ServerResponse
): void {
  let _headers: http.OutgoingHttpHeaders | null = null;
  let _data: Buffer | null = null;

  let _writeData = () => {
    if (_headers && _data) {
      _writeFixtureDataAsync(
        requestId,
        server,
        type,
        path,
        _data.toString('base64'),
        _headers,
        res.statusCode
      );
    }
  };

  let oldWriteHead = res.writeHead;
  res.writeHead = function (...args) {
    oldWriteHead.apply(this, args as any);

    _headers = res.getHeaders();
    _writeData();
  };

  let concatStream = concat((data) => {
    _data = data;
    _writeData();
  });

  proxyRes.on('error', () => {
    throw new Error(`Error in HTTP response stream for path: ${path}`);
  });
  proxyRes.pipe(concatStream);
}

async function _writeFixtureDataAsync(
  requestId: number,
  server: FixtureServer,
  type: FixtureType,
  path: string,
  data: string,
  headers?: http.OutgoingHttpHeaders,
  statusCode?: number,
  metadata?
): Promise<void> {
  let currentTime = new Date().getTime();
  if (!_initialTimeMs) {
    _initialTimeMs = currentTime;
  }
  let elapsedTime = currentTime - _initialTimeMs;

  let content = {
    requestId,
    server, // manifest or packager
    elapsedTime, // ms from the start of recording
    type, // 'httpRequest', 'httpResponse', 'wsUpgrade', 'wsOpen', 'wsInbound', 'wsOutbound', 'wsClosed'
    path,
    data,
    headers,
    statusCode,
    metadata,
    ...(type === FixtureType.FIND_TEXT_ON_SCREEN ? { testEventId: _testEventId++ } : null),
  };
  fs.appendFileSync(_outputFilePath!, JSON.stringify(content) + '\n');
}

export async function playFixtureAsync(
  filePath: string,
  playbackSpeed: number = 1.0,
  verbose: boolean = true
) {
  let packagerFixturePort = await freeportAsync(5060);
  let manifestFixturePort = await freeportAsync(5061);
  let lanAddress = ip.address();

  let packagerServer = http.createServer();
  let manifestServer = http.createServer();

  let { requestHandler } = await getFixtureServerRequestHandlerAsync(
    filePath,
    `${lanAddress}:${manifestFixturePort}`,
    `${lanAddress}:${packagerFixturePort}`,
    playbackSpeed,
    verbose,
    () => {
      packagerServer.destroy();
      manifestServer.destroy();
    }
  );

  packagerServer.on('request', (req, res) => {
    requestHandler('packager', req, res);
  });
  const wss = new WebSocket.Server({ server: packagerServer });
  wss.on('connection', (ws, req) => {
    // TODO: send/receive fixtures
    /*ws.on('message', function incoming(message) {
      console.log('received: %s', message);
    });

    ws.send('something');*/
  });

  packagerServer.listen(packagerFixturePort);
  enableDestroy(packagerServer);
  console.log(`Packager URL: exp://${lanAddress}:${packagerFixturePort}\n`);

  manifestServer.on('request', (req, res) => {
    requestHandler('manifest', req, res);
  });
  manifestServer.listen(manifestFixturePort, function () {
    let port = (manifestServer.address() as net.AddressInfo).port;

    if (verbose) {
      // Print out url
      qrcodeTerminal.generate(`exp://${lanAddress}:${port}`, (code) =>
        console.log(`${indentString(code, 2)}\n`)
      );
      console.log(`Your fixture URL is: exp://${lanAddress}:${port}\n`);

      if (playbackSpeed !== 1.0) {
        console.log(`Playing at ${playbackSpeed}x speed.\n`);
      }
    }
  });
  enableDestroy(manifestServer);

  return `${lanAddress}:${manifestFixturePort}`;
}

export async function getFixtureServerRequestHandlerAsync(
  filePath: string,
  manifestServerUrl: string,
  packagerServerUrl: string,
  playbackSpeed: number = 1.0,
  verbose: boolean = true,
  shutdownFn: Function
) {
  await _loginAsCorrectUserAsync();

  let currentFixtureResponseId = 0;
  let fixtures: any[] = [];
  fs.readFileSync(filePath)
    .toString()
    .split('\n')
    .forEach((data) => {
      try {
        fixtures.push(JSON.parse(data));
      } catch (e) {}
    });

  let getNextFixture = (server, path, type) => {
    let currentTime = new Date().getTime();
    if (!_initialTimeMs) {
      _initialTimeMs = currentTime;
    }
    let elapsedTime = (currentTime - _initialTimeMs) * playbackSpeed;

    for (let i = 0; i < fixtures.length; i++) {
      let fixture = fixtures[i];
      if (fixture.isConsumed) {
        continue;
      }
      if (fixture.elapsedTime > elapsedTime) {
        return null;
      }
      if (fixture.type === FixtureType.FIND_TEXT_ON_SCREEN && !fixture.isConsumed) {
        return null;
      }
      if (fixture.server === server && fixture.path === path && fixture.type === type) {
        return fixture;
      }
    }
  };
  let consumeFixture = (fixture) => {
    fixture.isConsumed = true;
  };

  let hasStartedShutdownTimeout = false;
  let isShutdown = false;
  let startShutdownTimeout = () => {
    if (hasStartedShutdownTimeout || !shutdownFn) {
      return;
    }

    hasStartedShutdownTimeout = true;
    let finalElapsedTime = fixtures[fixtures.length - 1].elapsedTime;
    setTimeout(() => {
      if (verbose) {
        console.log('Shutting down...');
      }

      shutdownFn();
      isShutdown = true;
    }, finalElapsedTime + PLAYBACK_SERVER_TIMEOUT);
  };

  let requestHandler = async (serverName, req, res) => {
    if (req.url === '/finished-test-event') {
      let testEventId = Number(req.headers['test-event-id']);
      console.log('Finished test event! ' + testEventId);
      for (let i = 0; i < fixtures.length; i++) {
        if (fixtures[i].testEventId === testEventId) {
          consumeFixture(fixtures[i]);
        }
      }
      return;
    }

    startShutdownTimeout();

    let fixtureResponseId = currentFixtureResponseId++;
    console.log(`[${fixtureResponseId}] Got request for ${req.url}...`);

    let requestFixture;
    let responseFixture;
    while (!(requestFixture = getNextFixture(serverName, req.url, FixtureType.HTTP_REQUEST))) {
      if (isShutdown) {
        res.end();
        return;
      }
      await sleepAsync(100);
    }
    consumeFixture(requestFixture);
    while (true) {
      if (isShutdown) {
        res.end();
        return;
      }
      responseFixture = getNextFixture(serverName, req.url, FixtureType.HTTP_RESPONSE);
      if (responseFixture && responseFixture.requestId === requestFixture.requestId) {
        break;
      }
      await sleepAsync(100);
    }
    consumeFixture(responseFixture);

    res.statusCode = responseFixture.statusCode;
    for (let header in responseFixture.headers) {
      res.setHeader(header, responseFixture.headers[header]);
    }

    let decodedData = base64.decode(responseFixture.data);
    let publishInfo = responseFixture.metadata ? responseFixture.metadata.publishInfo : null;
    decodedData = await _rewriteManifestAsync(
      publishInfo,
      req,
      decodedData,
      DEBUGGER_HOST_PLACEHOLDER,
      packagerServerUrl,
      MANIFEST_URL_PLACEHOLDER,
      manifestServerUrl
    );

    res.write(new Buffer(base64.encode(decodedData), 'base64'));
    res.end();
    console.log(`[${fixtureResponseId}] Responded to ${req.url}...`);
  };

  let testEvents = fixtures.filter((fixture) => {
    return fixture.type === FixtureType.FIND_TEXT_ON_SCREEN;
  });

  return {
    requestHandler,
    testEvents,
  };
}

declare module 'http' {
  interface IncomingMessage {
    _expoRequestId: number | undefined;
  }
}
