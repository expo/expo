import { apiClient } from '../apiClient';
import { restoreSessionAsync } from '../native-modules/DevLauncherAuth';
import { getUserProfileAsync } from './getUserProfileAsync';

export async function restoreUserAsync() {
  const session = await restoreSessionAsync();

  if (session) {
    // @ts-ignore
    apiClient.setHeader('expo-session', session);
    const userData = await getUserProfileAsync();
    return userData;
  }

  return undefined;
}
