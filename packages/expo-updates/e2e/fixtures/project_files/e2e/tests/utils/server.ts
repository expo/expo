import * as crypto from 'crypto';
import express from 'express';
import FormData from 'form-data';
import * as fs from 'fs';
import * as path from 'path';
import { serializeDictionary } from 'structured-headers';
import { setTimeout as setTimeoutNormal } from 'timers';
import { setTimeout } from 'timers/promises';

const app = express();

let server: { close: () => void } | null;

let messages: any[] = [];
let responsesToServe: any[] = [];

let updateRequest: null = null;

let manifestToServe: null = null;
let manifestHeadersToServe: { [x: string]: any } | null = null;

let multipartResponseToServe: any = null;
let requestedStaticFiles: string[] = [];

let protocolVersion: number = 1;
let artificialDelay: number = 0;
let serveOverriddenUrl: boolean = false;

function start(
  port: any,
  protocol: number = 1,
  artificialDelayMs: number = 0,
  shouldServeOverriddenUrl: boolean = false
) {
  if (!server) {
    server = app.listen(port);
    protocolVersion = protocol;
    artificialDelay = artificialDelayMs;
    serveOverriddenUrl = shouldServeOverriddenUrl;
  }
}

function stop() {
  if (server) {
    server.close();
    server = null;
  }
  messages = [];
  responsesToServe = [];
  updateRequest = null;
  manifestToServe = null;
  manifestHeadersToServe = null;
  multipartResponseToServe = null;
  requestedStaticFiles = [];
}

function getRequestedStaticFilesLength() {
  return requestedStaticFiles.length;
}

function consumeRequestedStaticFiles() {
  const returnArray = requestedStaticFiles;
  requestedStaticFiles = [];
  return returnArray;
}

app.use(express.json());
app.use('/static', (req: { url: string }, res: any, next: () => void) => {
  requestedStaticFiles.push(path.basename(req.url));
  next();
});
app.use('/static', express.static(path.resolve(__dirname, '..', '.static')));

app.get(
  '/notify/:string',
  (
    req: { params: { string: any } },
    res: {
      set: (arg0: string, arg1: string) => void;
      json: (arg0: any) => void;
      send: (arg0: string) => void;
    }
  ) => {
    messages.push(req.params.string);
    res.set('Cache-Control', 'no-store');
    if (responsesToServe[0]) {
      res.json(responsesToServe.shift());
    } else {
      res.send('Received request');
    }
  }
);

app.post(
  '/post',
  (
    req: { body: any },
    res: {
      set: (arg0: string, arg1: string) => void;
      json: (arg0: any) => void;
      send: (arg0: string) => void;
    }
  ) => {
    messages.push(req.body);
    res.set('Cache-Control', 'no-store');
    if (responsesToServe[0]) {
      res.json(responsesToServe.shift());
    } else {
      res.send('Received request');
    }
  }
);

app.get('/update', (req: any, res: any) => {
  if (serveOverriddenUrl) {
    res.statusCode = 204;
    res.setHeader('expo-protocol-version', 1);
    res.setHeader('expo-sfv-version', 0);
    res.setHeader('cache-control', 'private, max-age=0');
    res.end();
    return;
  }
  updateRequestHandler(req, res);
});

app.get('/update-override', (req: any, res: any) => {
  // serve the update on overridden
  updateRequestHandler(req, res);
});

const updateRequestHandler = (req: any, res: any) => {
  updateRequest = req;
  if (multipartResponseToServe) {
    // Protocol 1: multipart and rollbacks supported
    const form = new FormData();

    if (multipartResponseToServe.manifest) {
      form.append('manifest', JSON.stringify(multipartResponseToServe.manifest), {
        contentType: 'application/json',
        header: {
          'content-type': 'application/json; charset=utf-8',
          'expo-signature': multipartResponseToServe.manifestSignature,
        },
      });
    }

    if (multipartResponseToServe.directive) {
      form.append('directive', JSON.stringify(multipartResponseToServe.directive), {
        contentType: 'application/json',
        header: {
          'content-type': 'application/json; charset=utf-8',
          'expo-signature': multipartResponseToServe.directiveSignature,
        },
      });
    }

    const sendResponse = () => {
      res.statusCode = 200;
      res.setHeader('expo-protocol-version', 1);
      res.setHeader('expo-sfv-version', 0);
      res.setHeader('cache-control', 'private, max-age=0');
      res.setHeader('content-type', `multipart/mixed; boundary=${form.getBoundary()}`);
      res.write(form.getBuffer());
      res.end();
    };

    if (artificialDelay > 0) {
      setTimeoutNormal(() => {
        sendResponse();
      }, artificialDelay);
    } else {
      sendResponse();
    }
  } else {
    // Protocol 0
    if (manifestToServe) {
      if (manifestHeadersToServe) {
        Object.keys(manifestHeadersToServe).forEach((headerName) => {
          res.set(headerName, manifestHeadersToServe ? manifestHeadersToServe[headerName] : '');
        });
      }
      res.json(manifestToServe);
    } else {
      res.status(404).send('No update available');
    }
    res.status(404).send('No update available');
  }
};

async function waitForUpdateRequest(timeout: number): Promise<{ headers: any }> {
  const finishTime = new Date().getTime() + timeout;
  while (!updateRequest && server) {
    const currentTime = new Date().getTime();
    if (currentTime >= finishTime) {
      throw new Error('Timed out waiting for update request');
    }
    if (!server) {
      throw new Error('Server killed while waiting for update');
    }
    await setTimeout(50);
  }

  const request: { headers: any } = updateRequest || { headers: {} };
  updateRequest = null;
  return request;
}

async function getPrivateKeyAsync(projectRoot: string) {
  const codeSigningPrivateKeyPath = path.join(projectRoot, 'keys', 'private-key.pem');
  const pemBuffer = fs.readFileSync(path.resolve(codeSigningPrivateKeyPath));
  return pemBuffer.toString('utf8');
}

function signRSASHA256(
  data: string,
  privateKey: crypto.KeyLike | crypto.SignKeyObjectInput | crypto.SignPrivateKeyInput
) {
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(data, 'utf8');
  sign.end();
  return sign.sign(privateKey, 'base64');
}

function convertToDictionaryItemsRepresentation(
  obj: { [s: string]: unknown } | ArrayLike<unknown>
): any {
  return new Map(
    Object.entries(obj).map(([k, v]) => {
      return [k, [v, new Map()]];
    })
  );
}

function serveManifest(manifest: any, headers: any = null) {
  manifestToServe = manifest;
  manifestHeadersToServe = headers;
}

async function serveSignedManifest(manifest: any, projectRoot: any) {
  if (protocolVersion === 0) {
    serveSignedManifest0(manifest, projectRoot);
  } else {
    serveSignedManifest1(manifest, projectRoot);
  }
}

// Protocol 0
async function serveSignedManifest0(manifest: any, projectRoot: any) {
  const privateKey = await getPrivateKeyAsync(projectRoot);
  const manifestString = JSON.stringify(manifest);
  const hashSignature = signRSASHA256(manifestString, privateKey);
  const dictionary = convertToDictionaryItemsRepresentation({
    sig: hashSignature,
    keyid: 'main',
  });
  const signature = serializeDictionary(dictionary);
  serveManifest(manifest, { 'expo-protocol-version': '0', 'expo-signature': signature });
}

// Protocol 1 multipart response
async function serveSignedManifest1(manifest: any, projectRoot: any) {
  const privateKey = await getPrivateKeyAsync(projectRoot);
  const manifestString = JSON.stringify(manifest);
  const hashSignature = signRSASHA256(manifestString, privateKey);
  const dictionary = convertToDictionaryItemsRepresentation({
    sig: hashSignature,
    keyid: 'main',
  });
  const signature = serializeDictionary(dictionary);
  multipartResponseToServe = {
    manifest,
    manifestSignature: signature,
  };
}

// Protocol 1 directive response (including rollback)
async function serveSignedDirective(directive: any, projectRoot: string) {
  const privateKey = await getPrivateKeyAsync(projectRoot);
  const directiveString = JSON.stringify(directive);
  const hashSignature = signRSASHA256(directiveString, privateKey);
  const dictionary = convertToDictionaryItemsRepresentation({
    sig: hashSignature,
    keyid: 'main',
  });
  const signature = serializeDictionary(dictionary);
  multipartResponseToServe = {
    directive,
    directiveSignature: signature,
  };
}

const Server = {
  start,
  stop,
  waitForUpdateRequest,
  serveManifest,
  serveSignedManifest,
  serveSignedDirective,
  getRequestedStaticFilesLength,
  consumeRequestedStaticFiles,
};

export default Server;
