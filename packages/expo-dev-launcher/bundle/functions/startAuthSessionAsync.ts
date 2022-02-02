import url from 'url';

import { websiteOrigin } from '../apiClient';
import { openAuthSessionAsync, getAuthSchemeAsync } from '../native-modules/DevLauncherAuth';

export async function startAuthSessionAsync(type: 'signup' | 'login') {
  const scheme = await getAuthSchemeAsync();

  const redirectBase = `${scheme}://auth`;
  const authSessionURL = `${websiteOrigin}/${type}?app_redirect_uri=${encodeURIComponent(
    redirectBase
  )}`;

  const result = await openAuthSessionAsync(authSessionURL, redirectBase);

  if (result.type === 'success') {
    const { query } = url.parse(result.url, true);
    const sessionSecret = decodeURIComponent(query['session_secret'] as string);
    return sessionSecret;
  }

  return null;
}
