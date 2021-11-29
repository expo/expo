import { apiClient } from '../apiClient';
// import { restoreSessionAsync } from '../native-modules/DevMenuInternal';
import { getUserProfileAsync } from './getUserProfileAsync';

export async function restoreUserAsync() {
  // TODO:
  // const session = await restoreSessionAsync();
  const session = null;

  if (session) {
    apiClient.setHeader('expo-session', session.sessionSecret);
    const userData = await getUserProfileAsync();
    return userData;
  }

  return undefined;
}
