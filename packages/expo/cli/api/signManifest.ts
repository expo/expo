import { ExpoAppManifest, ExpoUpdatesManifest } from '@expo/config';
import { JSONObject } from '@expo/json-file';

import { fetchAsync } from './rest/client';
import { ensureLoggedInAsync } from './user/actions';
import { getActorDisplayName, getUserAsync } from './user/user';

export async function signEASManifestAsync(manifest: ExpoUpdatesManifest): Promise<string> {
  await ensureLoggedInAsync();
  const response = await fetchAsync(`manifest/eas/sign`, {
    method: 'POST',
    body: JSON.stringify({
      manifest,
    }),
  });
  const json = await response.json();
  return json.data.signature;
}

export async function signExpoGoManifestAsync(manifest: Partial<ExpoAppManifest>): Promise<string> {
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
