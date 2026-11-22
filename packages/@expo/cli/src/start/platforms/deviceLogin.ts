import { fetchAsync, getResponseDataOrThrow } from '../../api/rest/client';
import { getAccessToken, getSession } from '../../api/user/UserSettings';
import { env } from '../../utils/env';
import { event } from './events';

// TODO: Use a client ID of its own when the server has one for development builds.
const CLIENT_ID = 'expo-go';

async function postAsync<T>(path: string, body: object): Promise<T> {
  const response = await fetchAsync(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(5000),
  });
  return getResponseDataOrThrow<T>(await response.json());
}

/**
 * Adds the `__expo_device_*` params to a development build launch URL. The CLI creates an OAuth
 * device code and approves it with the session of `expo login`. The launcher exchanges the code
 * for a session of its own. A failure returns the URL unchanged.
 *
 * The result contains an approved code: do not log it.
 */
export async function withDeviceLoginParamsAsync(url: string): Promise<string> {
  if (
    !env.EXPO_UNSTABLE_DEV_CLIENT_LOGIN ||
    !url.includes('?__expo_url=') ||
    // A request with an access token does not use the session.
    getAccessToken() ||
    !getSession()?.sessionSecret
  ) {
    return url;
  }

  try {
    const device = await postAsync<{ device_code: string; user_code: string }>(
      'auth/device_authorization',
      { client_id: CLIENT_ID, device_name: 'Development build' }
    );
    const { device_verification_id } = await postAsync<{ device_verification_id: string }>(
      'auth/device-verifications/lookup',
      { user_code: device.user_code }
    );
    const { match_value } = await postAsync<{ match_value?: string }>(
      'auth/device-verifications/decide',
      { device_verification_id, decision: 'approve' }
    );
    if (!device.device_code || !match_value) {
      return url;
    }
    const params = new URLSearchParams({
      __expo_device_code: device.device_code,
      __expo_device_match: match_value,
      __expo_device_client: CLIENT_ID,
    });
    return `${url}&${params}`;
  } catch (error) {
    event('device_login_failed', { error: event.error(error as Error) });
    return url;
  }
}
