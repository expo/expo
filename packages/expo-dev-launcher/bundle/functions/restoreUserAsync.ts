import { apiClient } from '../apiClient';
import { restoreSessionAsync } from '../native-modules/DevMenuInternal';
import { getUserProfileAsync } from './getUserProfileAsync';

export async function restoreUserAsync() {
  const session = await restoreSessionAsync();

  if (session) {
    apiClient.setHeader('expo-session', session.sessionSecret);
    const userData = await getUserProfileAsync();
    return userData;
  }

  return undefined;
}
