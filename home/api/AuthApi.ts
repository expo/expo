import { APIV2Client } from './APIV2Client';

async function signOutAsync(sessionSecret: string | null): Promise<void> {
  if (!sessionSecret) {
    return;
  }
  const api = new APIV2Client();
  await api.sendAuthenticatedApiV2Request('auth/logout');
}

export default {
  signOutAsync,
};
