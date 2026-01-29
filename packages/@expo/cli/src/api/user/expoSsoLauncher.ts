import assert from 'assert';
import openBrowserAsync from 'better-opn';
import http from 'http';
import { Socket } from 'node:net';
import querystring from 'querystring';

import * as Log from '../../log';

export async function getSessionUsingBrowserAuthFlowAsync({
  expoWebsiteUrl,
  sso = false,
}: {
  expoWebsiteUrl: string;
  sso?: boolean;
}): Promise<string> {
  const scheme = 'http';
  const hostname = 'localhost';
  const path = '/auth/callback';

  const buildExpoLoginUrl = (port: number, sso: boolean): string => {
    const data = {
      app_redirect_uri: `${scheme}://${hostname}:${port}${path}`,
    };
    const params = querystring.stringify(data);
    return `${expoWebsiteUrl}${sso ? '/sso-login' : '/login'}?${params}`;
  };

  // Start server and begin auth flow
  const executeAuthFlow = (): Promise<string> => {
    return new Promise<string>(async (resolve, reject) => {
      const connections = new Set<Socket>();

      const server = http.createServer(
        (request: http.IncomingMessage, response: http.ServerResponse) => {
          const redirectAndCleanup = (result: 'success' | 'error'): void => {
            const redirectUrl = `${expoWebsiteUrl}/oauth/eas-cli?result=${result}`;
            response.writeHead(302, { Location: redirectUrl });
            response.end();
            server.close();
            for (const connection of connections) {
              connection.destroy();
            }
          };

          try {
            if (!(request.method === 'GET' && request.url?.includes('/auth/callback'))) {
              throw new Error('Unexpected login response.');
            }
            const url = new URL(request.url, `http:${request.headers.host}`);
            const sessionSecret = url.searchParams.get('session_secret');

            if (!sessionSecret) {
              throw new Error('Request missing session_secret search parameter.');
            }
            resolve(sessionSecret);
            redirectAndCleanup('success');
          } catch (error) {
            redirectAndCleanup('error');
            reject(error);
          }
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
