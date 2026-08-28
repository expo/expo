import http from 'http';

import { getGatewayAsync } from '../utils/ip';
import {
  CALLBACK_PATH,
  DEFAULT_RESPONSE_TIMEOUT_MS,
  FINGERPRINT_BODY_KEY,
  NONCE_BODY_KEY,
} from './fingerprintCheckProtocol';

export type FingerprintCallbackResult = { fingerprint: string | null };

const MAX_BODY_LENGTH = 4096;

export type FingerprintCallbackServer = {
  /** URL the app should POST its response to, reachable from the LAN. */
  callbackUrl: string;
  /** Resolves with the app's response, or `null` on timeout. Never rejects. */
  result: Promise<FingerprintCallbackResult | null>;
  /** Stop listening and clear the timeout. Safe to call more than once. */
  close(): void;
};

/**
 * Start a one-shot HTTP server that waits for the app to POST its embedded fingerprint back,
 * matched by nonce. A timeout resolves `result` with `null` — meaning "cannot determine",
 * never "up to date".
 */
export async function startFingerprintCallbackServerAsync(options: {
  nonce: string;
  timeoutMs?: number;
}): Promise<FingerprintCallbackServer> {
  const { nonce, timeoutMs = DEFAULT_RESPONSE_TIMEOUT_MS } = options;

  const gateway = await getGatewayAsync();
  if (gateway.internal || gateway.address === '127.0.0.1') {
    throw new Error(
      'This computer has no LAN address, so a physical device cannot reach it to report its fingerprint. ' +
        'Connect this computer to the same Wi-Fi network as the device, then try again.'
    );
  }

  let settled = false;
  let resolveResult!: (value: FingerprintCallbackResult | null) => void;
  const result = new Promise<FingerprintCallbackResult | null>((resolve) => {
    resolveResult = resolve;
  });
  function settleOnce(value: FingerprintCallbackResult | null): void {
    if (settled) {
      return;
    }
    settled = true;
    resolveResult(value);
  }

  const server = http.createServer((req, res) => {
    const url = req.url?.split('?')[0];
    if (req.method !== 'POST' || url !== CALLBACK_PATH) {
      res.writeHead(404).end();
      return;
    }

    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      // A real response is a few dozen bytes; the port is open to the whole LAN, so cap the
      // body instead of buffering whatever a peer streams at it.
      if (body.length > MAX_BODY_LENGTH) {
        res.writeHead(413).end();
        req.destroy();
      }
    });
    req.on('end', () => {
      let parsed: any;
      try {
        parsed = JSON.parse(body);
      } catch {
        res.writeHead(400).end();
        return;
      }
      const receivedNonce = parsed?.[NONCE_BODY_KEY];
      const fingerprint = parsed?.[FINGERPRINT_BODY_KEY];
      const isValidBody =
        typeof receivedNonce === 'string' &&
        (fingerprint === null || typeof fingerprint === 'string');
      if (!isValidBody || receivedNonce !== nonce) {
        // Keep listening: a mismatched or malformed request must not consume the one chance
        // to hear from the app.
        res.writeHead(400).end();
        return;
      }

      res
        .writeHead(200, { 'Content-Type': 'application/json' })
        .end(JSON.stringify({ status: 'ok' }));
      settleOnce({ fingerprint });
      close();
    });
  });

  let timer: ReturnType<typeof setTimeout> | undefined;
  function close(): void {
    if (timer) {
      clearTimeout(timer);
      timer = undefined;
    }
    // `server.close()` alone waits for in-flight and keep-alive sockets (iOS's URLSession keeps
    // connections alive), which would keep the process open past the verdict.
    server.closeAllConnections();
    server.close();
    settleOnce(null);
  }

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen({ port: 0, host: '0.0.0.0' }, resolve);
  });

  timer = setTimeout(() => close(), timeoutMs);

  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  const callbackUrl = `http://${gateway.address}:${port}${CALLBACK_PATH}`;

  return { callbackUrl, result, close };
}
