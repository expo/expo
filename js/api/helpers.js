import Store from '../redux/Store';

export function isAuthenticated() {
  let state = Store.getState();
  return (state.authTokens && state.authTokens.idToken) || state.session.sessionSecret;
}

export async function authenticatedFetch(url, options = {}) {
  let state = Store.getState();
  let idToken = state.authTokens.idToken;
  let sessionSecret = state.session.sessionSecret;

  let headers = {
    ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
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
