import { ExpoConfig } from '@expo/config';
import os from 'os';
import { URLSearchParams } from 'url';

import * as Log from '../log';
import { fetchAsync } from './rest/client';

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

  await fetchAsync('development-sessions/notify-alive', {
    searchParams,
    method: 'POST',
    body: JSON.stringify({
      data: createSessionInfo({ exp, runtime, url }),
    }),
  }).catch((e) => {
    Log.debug(`Error updating dev session: ${e}`);
  });
}
