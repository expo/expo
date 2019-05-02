import Store from '../redux/Store';

export function isAuthenticated(): boolean {
  let state = Store.getState();
  return state.session && !!state.session.sessionSecret;
}

export async function authenticatedFetch(
  uri: string,
  options: RequestInit = {}
): Promise<Response> {
  let { session } = Store.getState();

  let optionsWithAuthHeaders = {
    ...options,
    headers: {
      'expo-session': session.sessionSecret,
      ...options.headers,
    },
  };

  return fetch(uri, optionsWithAuthHeaders);
}
