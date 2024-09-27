import { ExpoConfig } from '@expo/config';
import os from 'os';
import { URLSearchParams } from 'url';
import http from 'http';

import { getExpoApiBaseUrl } from './endpoint';
import { fetchAsync } from './rest/client';
import { CommandError } from '../utils/errors';
import { getAccessToken, getSession } from './user/UserSettings';
import { once } from 'events';

/** Create the expected session info. */
export function createSessionInfo({
  exp,
  runtime,
  url,
}: {
  exp: Pick<ExpoConfig, 'name' | 'description' | 'slug' | 'primaryColor'>;
  runtime: 'native' | 'web';
  url: string;
}) {
  return {
    session: {
      description: `${exp.name} on ${os.hostname()}`,
      hostname: os.hostname(),
      platform: runtime,
      config: {
        // TODO: if icons are specified, upload a url for them too so people can distinguish
        description: exp.description,
        name: exp.name,
        slug: exp.slug,
        primaryColor: exp.primaryColor,
      },
      url,
      source: 'desktop',
    },
  };
}

/** Send a request to Expo API to keep the 'development session' alive for the provided devices. */
export async function updateDevelopmentSessionAsync({
  deviceIds,
  exp,
  runtime,
  url,
}: {
  deviceIds: string[];
  exp: Pick<ExpoConfig, 'name' | 'description' | 'slug' | 'primaryColor'>;
  runtime: 'native' | 'web';
  url: string;
}) {
  const searchParams = new URLSearchParams();
  deviceIds.forEach((id) => {
    searchParams.append('deviceId', id);
  });

  const results = await fetchAsync('development-sessions/notify-alive', {
    searchParams,
    method: 'POST',
    body: JSON.stringify({
      data: createSessionInfo({ exp, runtime, url }),
    }),
  });

  if (!results.ok) {
    throw new CommandError(
      'API',
      `Unexpected response when updating the development session on Expo servers: ${results.statusText}.`
    );
  }
}

/** Send a request to Expo API to close the 'development session' for the provided devices. */
export async function closeDevelopmentSessionAsync({
  deviceIds,
  url,
}: {
  deviceIds: string[];
  url: string;
}) {
  const searchParams = new URLSearchParams();
  deviceIds.forEach((id) => {
    searchParams.append('deviceId', id);
  });

  const results = await fetchAsync('development-sessions/notify-close', {
    searchParams,
    method: 'POST',
    body: JSON.stringify({
      session: { url },
    }),
  });

  if (!results.ok) {
    throw new CommandError(
      'API',
      `Unexpected response when closing the development session on Expo servers: ${results.statusText}.`
    );
  }
}

export async function closeDevelopmentSessionWithoutResponseAsync({
  deviceIds,
  url: sessionUrl,
}: {
  deviceIds: string[];
  url: string;
}) {
  const searchParams = new URLSearchParams();
  const headers: Record<string, string> = {};

  deviceIds.forEach((id) => {
    searchParams.append('deviceId', id);
  });

  const token = getAccessToken();
  if (token) {
    headers.authorization = `Bearer ${token}`;
  } else {
    const sessionSecret = getSession()?.sessionSecret;
    if (sessionSecret) {
      headers['expo-session'] = sessionSecret;
    }
  }

  // Not authenticated
  if (Object.keys(headers).length === 0) {
    return;
  }

  const url = new URL('/v2/development-sessions/notify-close', getExpoApiBaseUrl());

  const options = {
    method: 'POST',
    hostname: url.hostname,
    path: `${url.pathname}?${searchParams.toString()}`,
    port: url.port || 80,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
  };

  const req = http.request(options);

  await new Promise((resolve) => {
    req.once('close', resolve);
    req.once('error', resolve);

    req.write(JSON.stringify({ session: { url: sessionUrl } }));
    req.end();
  });
}
