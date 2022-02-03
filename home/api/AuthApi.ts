import ApiV2HttpClient from './ApiV2HttpClient';

export async function signOutAsync(sessionSecret: string | null): Promise<void> {
  if (!sessionSecret) {
    return;
  }
  const api = new ApiV2HttpClient();
  await api.postAsync('auth/logout');
}

export default {
  signOutAsync,
};
