/* @flow */

import ApolloClient from 'apollo-client';
import createAuthAwareNetworkInterface from './createAuthAwareNetworkInterface';
import SessionActions from '../redux/SessionActions';

function getSessionSecret() {
  let Store = require('../redux/Store').default;
  let state = Store.getState();
  return state.session.sessionSecret;
}

function setSession(session) {
  let Store = require('../redux/Store').default;
  Store.dispatch(SessionActions.setSession(session));
}

async function signOutAsync(options = {}) {
  let Store = require('../redux/Store').default;
  Store.dispatch(SessionActions.signOut(options));
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
    getSessionSecret,
    setSession,
    signOutAsync,
  }),
});
