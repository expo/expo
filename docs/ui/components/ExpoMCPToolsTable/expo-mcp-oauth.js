import {
  discoverAuthorizationServerMetadata,
  registerClient,
  startAuthorization,
  exchangeAuthorization,
  refreshAuthorization,
} from '@modelcontextprotocol/sdk/client/auth.js';
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';

/**
 * mcp.expo.dev is an OAuth 2.0 protected resource.
 * This module implements the authorization code + PKCE
 * flow to obtain access tokens for it.
 */
export const EXPO_MCP_URL = 'https://mcp.expo.dev/mcp';

const AUTHORIZATION_SERVER = 'https://mcp.expo.dev';
const RESOURCE = new URL(EXPO_MCP_URL);
const SCOPE = 'mcp:access';

const AUTH_DIR = path.join(os.homedir(), '.expo-mcp-docs-sync');
const AUTH_FILE = path.join(AUTH_DIR, 'auth.json');

const REDIRECT_TIMEOUT_MS = 5 * 60 * 1000;

function loadCache() {
  try {
    return JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function saveCache(cache) {
  fs.mkdirSync(AUTH_DIR, { recursive: true, mode: 0o700 });
  fs.writeFileSync(AUTH_FILE, JSON.stringify(cache, null, 2) + '\n', { mode: 0o600 });
  fs.chmodSync(AUTH_FILE, 0o600);
}

function openBrowser(url) {
  const [cmd, args, extraOptions] =
    process.platform === 'darwin'
      ? ['open', [url], {}]
      : process.platform === 'win32'
        ? [
            'cmd',
            ['/c', 'start', '""', '/b', url.replace(/&/g, '^&')],
            { windowsVerbatimArguments: true },
          ]
        : ['xdg-open', [url], {}];
  try {
    spawn(cmd, args, { stdio: 'ignore', detached: true, ...extraOptions }).unref();
  } catch {}
}

function waitForRedirect(expectedState) {
  let resolveCode;
  let rejectCode;
  const code = new Promise((resolve, reject) => {
    resolveCode = resolve;
    rejectCode = reject;
  });

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname !== '/oauth/callback') {
      res.writeHead(404).end();
      return;
    }
    const error = url.searchParams.get('error');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    if (error) {
      res.end('<p>Authorization failed. You can close this tab.</p>');
      rejectCode(new Error(`Authorization failed: ${error}`));
    } else if (url.searchParams.get('state') !== expectedState) {
      res.end('<p>State mismatch. You can close this tab.</p>');
      rejectCode(new Error('OAuth state mismatch (possible CSRF). Aborting.'));
    } else {
      const authCode = url.searchParams.get('code');
      if (!authCode) {
        res.end('<p>No authorization code received. You can close this tab.</p>');
        rejectCode(new Error('Authorization response did not include a code.'));
      } else {
        res.end(
          '<p>Authentication complete. You can close this tab and return to the terminal.</p>'
        );
        resolveCode(authCode);
      }
    }
  });

  const ready = new Promise((resolve, reject) => {
    server.once('error', error => {
      reject(error);
      rejectCode(error);
    });
    server.listen(0, '127.0.0.1', () => {
      resolve(`http://127.0.0.1:${server.address().port}/oauth/callback`);
    });
  });

  const timeout = setTimeout(
    () => rejectCode(new Error('Timed out waiting for browser authorization (5 min).')),
    REDIRECT_TIMEOUT_MS
  );
  code
    .finally(() => {
      clearTimeout(timeout);
      server.close();
    })
    .catch(() => {});

  return { ready, code };
}

async function fullLogin(metadata) {
  const state = crypto.randomUUID();
  const { ready, code } = waitForRedirect(state);
  const redirectUrl = await ready;

  console.log('  Registering OAuth client with mcp.expo.dev...');
  const clientInformation = await registerClient(AUTHORIZATION_SERVER, {
    metadata,
    clientMetadata: {
      client_name: 'expo-docs-mcp-sync',
      redirect_uris: [redirectUrl],
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
      scope: SCOPE,
    },
  });

  const { authorizationUrl, codeVerifier } = await startAuthorization(AUTHORIZATION_SERVER, {
    metadata,
    clientInformation,
    redirectUrl,
    scope: SCOPE,
    state,
    resource: RESOURCE,
  });

  console.log(
    `\n  Opening your browser to authorize. If it does not open, visit:\n  ${authorizationUrl.href}\n`
  );
  openBrowser(authorizationUrl.href);

  const authorizationCode = await code;
  const tokens = await exchangeAuthorization(AUTHORIZATION_SERVER, {
    metadata,
    clientInformation,
    authorizationCode,
    codeVerifier,
    redirectUri: redirectUrl,
    resource: RESOURCE,
  });

  saveCache({ clientInformation, tokens });
  console.log(`  Authenticated. Tokens cached at ${AUTH_FILE}`);
  return tokens.access_token;
}

export async function getExpoMcpAccessToken() {
  const metadata = await discoverAuthorizationServerMetadata(AUTHORIZATION_SERVER);
  if (!metadata) {
    throw new Error(`Could not discover OAuth metadata for ${AUTHORIZATION_SERVER}.`);
  }

  const cache = loadCache();
  if (cache.tokens?.refresh_token && cache.clientInformation) {
    try {
      const tokens = await refreshAuthorization(AUTHORIZATION_SERVER, {
        metadata,
        clientInformation: cache.clientInformation,
        refreshToken: cache.tokens.refresh_token,
        resource: RESOURCE,
      });
      tokens.refresh_token ??= cache.tokens.refresh_token;
      saveCache({ clientInformation: cache.clientInformation, tokens });
      return tokens.access_token;
    } catch (error) {
      console.log(
        `  Cached token could not be refreshed (${error.message}); starting a new login.`
      );
    }
  }

  return fullLogin(metadata);
}
