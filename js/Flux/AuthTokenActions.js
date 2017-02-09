/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule AuthTokenActions
 */
'use strict';

import { action } from 'Flux';
import LocalStorage from '../Storage/LocalStorage';

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
  signOut() {
    LocalStorage.removeAuthTokensAsync();
    return null;
  },
};

export default AuthTokenActions;
