import ApolloClient, { createNetworkInterface } from 'apollo-client';
import createAuthAwareNetworkInterface from './createAuthAwareNetworkInterface';
import Auth0Api from './Auth0Api';
import Actions from '../state/actions';

function getIdToken() {
  let Store = require('../state/Store').default;
  let state = Store.getState();
  if (state.authTokens) {
    return state.authTokens.idToken;
  } else {
    return null;
  }
}

function getRefreshToken() {
  let Store = require('../state/Store').default;
  let state = Store.getState();
  if (state.authTokens) {
    return state.authTokens.refreshToken;
  } else {
    return null;
  }
}

function setIdToken(idToken) {
  let Store = require('../state/Store').default;
  Store.dispatch(Actions.updateIdToken(idToken));
}

function idTokenIsValid() {
  let idToken = getIdToken();

  if (!idToken) {
    return false;
  } else {
    return !Auth0Api.tokenIsExpired(idToken);
  }
}

async function refreshIdTokenAsync() {
  let newAuthTokens = await Auth0Api.refreshIdTokenAsync(getRefreshToken());
  return newAuthTokens.id_token;
}

export default new ApolloClient({
  networkInterface: createAuthAwareNetworkInterface({
    uri: 'https://16.pr.www.exp.host/--/graphql',
    getIdToken,
    setIdToken,
    getRefreshToken,
    idTokenIsValid,
    refreshIdTokenAsync,
  }),
});
