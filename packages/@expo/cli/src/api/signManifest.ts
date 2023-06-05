import { ExpoAppManifest } from '@expo/config';
import { JSONObject } from '@expo/json-file';

import { fetchAsync } from './rest/client';
import { ensureLoggedInAsync } from './user/actions';
import { getActorDisplayName, getUserAsync } from './user/user';

/** Sign a classic manifest to access secure features in sandboxed environments like Expo Go. */
export async function signClassicExpoGoManifestAsync(
  manifest: Partial<ExpoAppManifest>
): Promise<string> {
  await ensureLoggedInAsync();
  const res = await fetchAsync('manifest/sign', {
    method: 'POST',
    body: JSON.stringify({
      args: {
        remoteUsername: manifest.owner ?? getActorDisplayName(await getUserAsync()),
        remotePackageName: manifest.slug,
      },
      manifest: manifest as JSONObject,
    }),
  });
  const { data } = await res.json();
  return data.response;
}
