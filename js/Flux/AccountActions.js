/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule AccountActions
 */
'use strict';

import { AsyncStorage } from 'react-native';

import ApiClient from 'ApiClient';
import Flux from 'Flux';
import StorageKeys from 'StorageKeys';

export default Flux.createActions({
  setAccount(email, skipRegistration) {
    return { email, skipRegistration };
  },

  async skipRegistrationAsync() {
    await AsyncStorage.setItem(StorageKeys.SkipRegistration, 'true');
  },

  async registerAccountAsync(email) {
    await AsyncStorage.setItem(StorageKeys.Email, email);

    try {
      await ApiClient.recordEmailAsync(email);
    } catch (error) {
      return { email, error };
    }

    return { email };
  },
});
