import { AsyncStorage, NativeModules } from 'react-native';
import mapValues from 'lodash/mapValues';
import addListenerWithNativeCallback from '../utils/addListenerWithNativeCallback';
const { ExponentKernel } = NativeModules;

const Keys = mapValues(
  {
    AuthTokens: 'authTokens',
    Session: 'session',
    History: 'history',
    Settings: 'settings',
    NuxIsFinished: 'nuxIsFinishedApr-17-2017',
  },
  value => `Exponent.${value}`
);

async function _getLegacyIsNuxFinishedAsync() {
  let result = await AsyncStorage.getItem(Keys.NuxIsFinished);
  return result;
}

async function migrateNuxStateToNativeAsync() {
  const result = await _getLegacyIsNuxFinishedAsync();
  if (result === 'true' && ExponentKernel && ExponentKernel.setIsNuxFinishedAsync) {
    await ExponentKernel.setIsNuxFinishedAsync(true);
    await AsyncStorage.removeItem(Keys.NuxIsFinished);
  }
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

async function getSessionAsync() {
  let results = await ExponentKernel.getSessionAsync();
  if (!results) {
    // NOTE(2018-11-8): we are migrating to storing all session keys
    // using the Kernel module instead of AsyncStorage, but we need to
    // continue to check the old location for a little while
    // until all clients in use have migrated over
    results = await AsyncStorage.getItem(Keys.Session);
    if (results) {
      try {
        results = JSON.parse(results);
        await saveSessionAsync(results);
        await AsyncStorage.removeItem(Keys.Session);
      } catch (e) {
        return null;
      }
    }
  }

  return results;
}

async function saveSessionAsync(session) {
  return ExponentKernel.setSessionAsync(session);
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

async function removeAuthTokensAsync() {
  return AsyncStorage.removeItem(Keys.AuthTokens);
}

async function removeSessionAsync() {
  return ExponentKernel.removeSessionAsync();
}

async function clearAllAsync() {
  await Promise.all(Object.values(Keys).map(k => AsyncStorage.removeItem(k)));
}

// adds a hook for native code to query Home's history.
// needed for routing push notifications in Home.
addListenerWithNativeCallback('ExponentKernel.getHistoryUrlForExperienceId', async event => {
  const { experienceId } = event;
  let history = await getHistoryAsync();
  history = history.sort((item1, item2) => {
    // date descending -- we want to pick the most recent experience with this id,
    // in case there are multiple (e.g. somebody was developing against various URLs of the
    // same app)
    let item2time = item2.time ? item2.time : 0;
    let item1time = item1.time ? item1.time : 0;
    return item2time - item1time;
  });
  let historyItem = history.find(item => item.manifest && item.manifest.id === experienceId);
  if (historyItem) {
    return { url: historyItem.url };
  }
  return {};
});

export default {
  clearHistoryAsync,
  clearAllAsync,
  getSessionAsync,
  getHistoryAsync,
  getSettingsAsync,
  saveHistoryAsync,
  saveSessionAsync,
  migrateNuxStateToNativeAsync,
  removeAuthTokensAsync,
  removeSessionAsync,
  updateSettingsAsync,
};
