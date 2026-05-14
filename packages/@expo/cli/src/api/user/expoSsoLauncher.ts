import assert from 'assert';
import openBrowserAsync from 'better-opn';
import crypto from 'crypto';
import http from 'http';
import type { Socket } from 'node:net';

import * as Log from '../../log';
import { CommandError } from '../../utils/errors';
import { fetchAsync, getResponseDataOrThrow } from '../rest/client';

const CLIENT_ID = 'expo-cli';

function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url');
}

function generateCodeChallenge(codeVerifier: string): string {
  return crypto.createHash('sha256').update(codeVerifier).digest('base64url');
}

function generateState(): string {
  return crypto.randomBytes(32).toString('base64url');
}

async function exchangeCodeForSessionSecretAsync({
  code,
  codeVerifier,
  redirectUri,
}: {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}): Promise<string> {
  const response = await fetchAsync('auth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
      client_id: CLIENT_ID,
    }),
  });
  const { session_secret: sessionSecret } = getResponseDataOrThrow<{ session_secret?: string }>(
    await response.json()
  );
  if (!sessionSecret) {
    throw new CommandError('BROWSER_AUTH', 'Failed to obtain session secret from token exchange.');
  }
  return sessionSecret;
}

export async function getSessionUsingBrowserAuthFlowAsync({
  expoWebsiteUrl,
  sso = false,
}: {
  expoWebsiteUrl: string;
  sso?: boolean;
}): Promise<string> {
  const scheme = 'http';
  const hostname = 'localhost';
  const callbackPath = '/auth/callback';

  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const state = generateState();

  const buildRedirectUri = (port: number): string =>
    `${scheme}://${hostname}:${port}${callbackPath}`;

  const buildExpoLoginUrl = (port: number, sso: boolean): string => {
    // Note: we avoid URLSearchParams here because better-opn calls encodeURI()
    // on the URL before passing it to AppleScript, which would double-encode
    // the percent-encoded values from URLSearchParams.toString().
    const params = [
      `client_id=${CLIENT_ID}`,
      `redirect_uri=${buildRedirectUri(port)}`,
      `response_type=code`,
      `code_challenge=${codeChallenge}`,
      `code_challenge_method=S256`,
      `state=${state}`,
      `confirm_account=true`,
    ].join('&');
    return `${expoWebsiteUrl}${sso ? '/sso-login' : '/login'}?${params}`;
  };

  // Start server and begin auth flow
  const executeAuthFlow = (): Promise<string> => {
    return new Promise<string>(async (resolve, reject) => {
      const connections = new Set<Socket>();

      const server = http.createServer(
        (request: http.IncomingMessage, response: http.ServerResponse) => {
          const redirectAndCleanup = (result: 'success' | 'error'): void => {
            const redirectUrl = `${expoWebsiteUrl}/oauth/expo-cli?result=${result}`;
            response.writeHead(302, { Location: redirectUrl });
            response.end();
            server.close();
            for (const connection of connections) {
              connection.destroy();
            }
          };

          const handleRequestAsync = async (): Promise<void> => {
            if (!(request.method === 'GET' && request.url?.includes(callbackPath))) {
              throw new CommandError('BROWSER_AUTH', 'Unexpected login response.');
            }
            const url = new URL(request.url, `http:${request.headers.host}`);
            const code = url.searchParams.get('code');
            const returnedState = url.searchParams.get('state');

            if (!code) {
              throw new CommandError('BROWSER_AUTH', 'Request missing code search parameter.');
            }
            if (returnedState !== state) {
              throw new CommandError('BROWSER_AUTH', 'State mismatch. Possible CSRF attack.');
            }

            const address = server.address();
            assert(address !== null && typeof address === 'object');
            const redirectUri = buildRedirectUri(address.port);

            const sessionSecret = await exchangeCodeForSessionSecretAsync({
              code,
              codeVerifier,
              redirectUri,
            });

            resolve(sessionSecret);
            redirectAndCleanup('success');
          };

          handleRequestAsync().catch((error) => {
            redirectAndCleanup('error');
            reject(error);
          });
        }
      );

      server.listen(0, hostname, () => {
        Log.log('Waiting for browser login...');

        const address = server.address();
        assert(
          address !== null && typeof address === 'object',
          'Server address and port should be set after listening has begun'
        );
        const port = address.port;
        const authorizeUrl = buildExpoLoginUrl(port, sso);
        Log.log(
          `If your browser doesn't automatically open, visit this link to log in: ${authorizeUrl}`
        );
        openBrowserAsync(authorizeUrl);
      });

      server.on('connection', (connection) => {
        connections.add(connection);

        connection.on('close', () => {
          connections.delete(connection);
        });
      });
    });
  };

  return await executeAuthFlow();
}
