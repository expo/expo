/* @flow */

import ApolloClient from 'apollo-client';
import createAuthAwareNetworkInterface from './createAuthAwareNetworkInterface';
import Auth0Api from './Auth0Api';
import AuthTokenActions from '../Flux/AuthTokenActions';
import SessionActions from '../Flux/SessionActions';

function getIdToken() {
  let Store = require('../Flux/ExStore').default;
  let state = Store.getState();
  if (state.authTokens) {
    return state.authTokens.idToken;
  } else {
    return null;
  }
}

function getRefreshToken() {
  let Store = require('../Flux/ExStore').default;
  let state = Store.getState();
  if (state.authTokens) {
    return state.authTokens.refreshToken;
  } else {
    return null;
  }
}

function setIdToken(idToken) {
  let Store = require('../Flux/ExStore').default;
  Store.dispatch(AuthTokenActions.updateIdToken(idToken));
}

function idTokenIsValid() {
  let idToken = getIdToken();

  if (!idToken) {
    return false;
  } else {
    return !Auth0Api.tokenIsExpired(idToken);
  }
}

async function refreshIdTokenAsync(): Promise<string> {
  let refreshToken = getRefreshToken();
  if (!refreshToken) {
    if (__DEV__) {
      alert('Tried to refresh id token but no refresh token is available!');
    }

    return '';
  }

  let newAuthTokens: { id_token: string } = await Auth0Api.refreshIdTokenAsync(refreshToken);

  if (__DEV__) {
    if (!newAuthTokens.id_token) {
      alert(
        'Failed to refresh id token! Talk to whoever is maintaining home and ' +
          'let them know that the refresh flow is broken'
      );
    }
  }

  return newAuthTokens.id_token;
}

function getSessionSecret() {
  let Store = require('../Flux/ExStore').default;
  let state = Store.getState();
  return state.session.sessionSecret;
}

function setSession(session) {
  let Store = require('../Flux/ExStore').default;
  Store.dispatch(SessionActions.setSession(session));
}

async function signOutAsync(options = {}) {
  let Store = require('../Flux/ExStore').default;
  Store.dispatch(AuthTokenActions.clearAuthTokens());
  Store.dispatch(await SessionActions.signOutAsync(options));
}

async function migrateAuth0ToSessionAsync() {
  const idToken = getIdToken();
  // If we dont have a valid idToken, or if we already have a session, abort migration
  if (!idTokenIsValid() || getSessionSecret()) {
    return;
  }
  const response = await Auth0Api.migrateAuth0ToSessionAsync(idToken);
  if (response && response.data && response.data.sessionSecret) {
    setSession({ sessionSecret: response.data.sessionSecret });
  }
}

export default new ApolloClient({
  dataIdFromObject: result => {
    if (result.id && result.__typename) {
      return result.__typename + result.id;
    }

    // Make sure to return null if this object doesn't have an ID
    return null;
  },
  networkInterface: createAuthAwareNetworkInterface({
    uri: 'https://exp.host/--/graphql',
    getIdToken,
    setIdToken,
    getRefreshToken,
    idTokenIsValid,
    refreshIdTokenAsync,
    getSessionSecret,
    setSession,
    signOutAsync,
    migrateAuth0ToSessionAsync,
  }),
});
