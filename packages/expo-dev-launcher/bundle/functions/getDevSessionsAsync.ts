import { Platform } from 'react-native';

import { restClient, restClientWithTimeout } from '../apiClient';
import { DevSession } from '../types';

// TODO -- move this into context / make it settable via JS
const baseAddress = Platform.select({
  ios: 'http://localhost',
  android: 'http://10.0.2.2',
});

const statusPage = 'status';
const portsToCheck = [8081, 8082, 8083, 8084, 8085, 19000, 19001, 19002];

export async function getDevSessionsAsync({
  isAuthenticated = false,
  installationID = '',
  isDevice = false,
  timeout,
}: {
  isAuthenticated?: boolean;
  installationID?: string;
  isDevice?: boolean;
  timeout?: number;
}): Promise<DevSession[]> {
  let devSessions: DevSession[] = [];

  if (isAuthenticated) {
    const sessions = await fetchDevSessions(null, timeout);
    devSessions = devSessions.concat(sessions);
  }

  if (!devSessions.length && installationID) {
    const sessions = await fetchDevSessions(installationID, timeout);
    devSessions = devSessions.concat(sessions);
  }

  if (!devSessions.length && !isDevice) {
    const localPackagers = await getLocalPackagersAsync();
    devSessions = devSessions.concat(localPackagers);
  }

  return devSessions;
}

export async function getLocalPackagersAsync(): Promise<DevSession[]> {
  const onlineDevSessions: DevSession[] = [];

  await Promise.all(
    portsToCheck.map(async (port) => {
      try {
        const address = `${baseAddress}:${port}`;
        const { status } = await fetch(`${address}/${statusPage}`);
        if (status === 200) {
          onlineDevSessions.push({
            url: address,
            description: address,
            source: 'desktop',
          });
        }
      } catch {}
    })
  );

  return onlineDevSessions;
}

export async function fetchDevSessions(installationID?: string | null, timeout?: number) {
  let devSessionsEndpoint = `/development-sessions`;
  const headers = {};

  if (installationID != null) {
    devSessionsEndpoint += `?deviceId=${installationID}`;
    headers['Expo-Dev-Client-ID'] = installationID;
  }

  if (timeout) {
    const sessions = await restClientWithTimeout<{ data: DevSession[] }>(
      devSessionsEndpoint,
      timeout,
      {
        headers,
      }
    );
    return sessions.data ?? [];
  } else {
    const sessions = await restClient<{ data: DevSession[] }>(devSessionsEndpoint, {
      headers,
    });
    return sessions.data ?? [];
  }
}
