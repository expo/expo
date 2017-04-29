/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule LocalStorage
 */
'use strict';

import { AsyncStorage } from 'react-native';
import { LegacyAsyncStorage } from 'expo';
import mapValues from 'lodash/mapValues';

const Keys = mapValues(
  {
    AuthTokens: 'authTokens',
    History: 'history',
    Settings: 'settings',
    NuxIsFinished: 'nuxIsFinishedApr-17-2017',
  },
  value => `Exponent.${value}`
);

function maybeMigrateFromLegacyAsync() {
  return LegacyAsyncStorage.migrateItems(Object.values(Keys));
}

async function getIsNuxFinishedAsync() {
  let result = await AsyncStorage.getItem(Keys.NuxIsFinished);
  return result;
}

async function getSettingsAsync() {
  let results = await AsyncStorage.getItem(Keys.Settings);
  let settings;

  try {
    settings = JSON.parse(results);
  } catch (e) {}

  return settings || {};
}

async function updateSettingsAsync(updatedSettings) {
  let currentSettings = await getSettingsAsync();
  let newSettings = {
    ...currentSettings,
    ...updatedSettings,
  };

  return AsyncStorage.setItem(Keys.Settings, JSON.stringify(newSettings));
}

async function getAuthTokensAsync() {
  let results = await AsyncStorage.getItem(Keys.AuthTokens);

  try {
    let authTokens = JSON.parse(results);
    return authTokens;
  } catch (e) {
    return null;
  }
}

async function saveAuthTokensAsync(authTokens) {
  return AsyncStorage.setItem(Keys.AuthTokens, JSON.stringify(authTokens));
}

async function getHistoryAsync() {
  let jsonHistory = await AsyncStorage.getItem(Keys.History);
  if (jsonHistory) {
    try {
      return JSON.parse(jsonHistory);
    } catch (e) {
      console.error(e);
    }
  }
  return [];
}

async function saveHistoryAsync(history) {
  return AsyncStorage.setItem(Keys.History, JSON.stringify(history));
}

async function clearHistoryAsync() {
  return AsyncStorage.removeItem(Keys.History);
}

async function saveIsNuxFinishedAsync(isFinished) {
  return AsyncStorage.setItem(Keys.NuxIsFinished, JSON.stringify(isFinished));
}

async function updateIdTokenAsync(idToken) {
  let tokens = await getAuthTokensAsync();

  if (!tokens) {
    await clearAllAsync();
    throw new Error('Missing cached authentication tokens');
  }

  return saveAuthTokensAsync({ ...tokens, idToken });
}

async function removeAuthTokensAsync() {
  return AsyncStorage.removeItem(Keys.AuthTokens);
}

async function clearAllAsync() {
  await Promise.all(Object.values(Keys).map(k => AsyncStorage.removeItem(k)));
}

export default {
  clearHistoryAsync,
  clearAllAsync,
  getAuthTokensAsync,
  getIsNuxFinishedAsync,
  getHistoryAsync,
  getSettingsAsync,
  saveAuthTokensAsync,
  saveHistoryAsync,
  saveIsNuxFinishedAsync,
  removeAuthTokensAsync,
  updateIdTokenAsync,
  updateSettingsAsync,
  maybeMigrateFromLegacyAsync,
};
