import * as DevMenuInternal from '../DevMenuInternal';

const SESSION_KEY = 'expo-dev-menu.session';

export async function saveSessionAsync(session) {
  await DevMenuInternal.saveAsync(SESSION_KEY, JSON.stringify(session));
}

export async function getSessionAsync() {
  const data = await DevMenuInternal.getAsync(SESSION_KEY);

  if (!data) {
    return null;
  }

  try {
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
}
