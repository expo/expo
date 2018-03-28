import Store from '../redux/Store';

export function isAuthenticated() {
  let state = Store.getState();
  return state.authTokens && state.authTokens.idToken;
}

export async function authenticatedFetch(url, options = {}) {
  let state = Store.getState();
  let idToken = state.authTokens.idToken;

  let headers = {
    Authorization: `Bearer ${idToken}`,
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
