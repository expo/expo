import Store from '../redux/Store';

export function isAuthenticated() {
  let state = Store.getState();
  return state.session && state.session.sessionSecret;
}

export async function authenticatedFetch(url, options = {}) {
  let state = Store.getState();
  let sessionSecret = state.session.sessionSecret;

  let headers = {
    ...(sessionSecret ? { 'Expo-Session': sessionSecret } : {}),
  };

  let optionsWithAuthHeaders = {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  };

  return fetch(url, optionsWithAuthHeaders);
}
