/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule AuthTokenActions
 */

import LocalStorage from '../Storage/LocalStorage';

import { action } from 'Flux';

let AuthTokenActions = {
  @action
  setAuthTokens(tokens) {
    LocalStorage.saveAuthTokensAsync(tokens);
    return tokens;
  },

  @action
  updateIdToken(idToken) {
    LocalStorage.updateIdTokenAsync(idToken);
    return { idToken };
  },

  @action
  clearAuthTokens() {
    LocalStorage.removeAuthTokensAsync();
    return null;
  },
};

export default AuthTokenActions;
