/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule SessionActions
 */

import Analytics from '../Api/Analytics';
import LocalStorage from '../Storage/LocalStorage';
import ApolloClient from '../Api/ApolloClient';
import Auth0Api from '../Api/Auth0Api';

import { action } from 'Flux';

let SessionActions = {
  @action
  setSession(session) {
    LocalStorage.saveSessionAsync(session);
    return session;
  },

  @action
  async signOutAsync(options = {}) {
    const { shouldResetApolloStore } = options.shouldResetApolloStore || true;
    const session = await LocalStorage.getSessionAsync();
    await Auth0Api.signOutAsync(session.sessionSecret);
    await LocalStorage.removeSessionAsync();
    await LocalStorage.clearHistoryAsync();

    Analytics.track(Analytics.events.USER_LOGGED_OUT);
    Analytics.identify(null);
    if (shouldResetApolloStore) {
      ApolloClient.resetStore();
    }

    return null;
  },
};

export default SessionActions;
