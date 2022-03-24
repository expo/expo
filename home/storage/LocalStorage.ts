import AsyncStorage from '@react-native-async-storage/async-storage';
import mapValues from 'lodash/mapValues';
import { SessionObject } from 'redux/SessionReducer';

import * as Kernel from '../kernel/Kernel';
import { HistoryItem } from '../types';
import addListenerWithNativeCallback from '../utils/addListenerWithNativeCallback';

type Settings = Record<string, any>;

const Keys = mapValues(
  {
    Session: 'session',
    History: 'history',
    Settings: 'settings',
  },
  (value) => `Exponent.${value}`
);

async function getSettingsAsync(): Promise<Settings> {
  const json = await AsyncStorage.getItem(Keys.Settings);
  if (!json) {
    return {};
  }

  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
}

async function updateSettingsAsync(updatedSettings: Partial<Settings>): Promise<void> {
  const currentSettings = await getSettingsAsync();
  const newSettings = {
    ...currentSettings,
    ...updatedSettings,
  };

  await AsyncStorage.setItem(Keys.Settings, JSON.stringify(newSettings));
}

async function getSessionAsync() {
  let results = await Kernel.getSessionAsync();
  if (!results) {
    // NOTE(2018-11-8): we are migrating to storing all session keys
    // using the Kernel module instead of AsyncStorage, but we need to
    // continue to check the old location for a little while
    // until all clients in use have migrated over
    const json = await AsyncStorage.getItem(Keys.Session);
    if (json) {
      try {
        results = JSON.parse(json);
        await saveSessionAsync(results as SessionObject);
        await AsyncStorage.removeItem(Keys.Session);
      } catch {
        return null;
      }
    }
  }

  return results;
}

async function saveSessionAsync(session: SessionObject): Promise<void> {
  await Kernel.setSessionAsync(session as any);
}

async function getHistoryAsync(): Promise<HistoryItem[]> {
  const jsonHistory = await AsyncStorage.getItem(Keys.History);
  if (jsonHistory) {
    try {
      return JSON.parse(jsonHistory);
    } catch (e) {
      console.error(e);
    }
  }
  return [];
}

async function saveHistoryAsync(history: HistoryItem[]): Promise<void> {
  await AsyncStorage.setItem(Keys.History, JSON.stringify(history));
}

async function clearHistoryAsync(): Promise<void> {
  await AsyncStorage.removeItem(Keys.History);
}

async function removeSessionAsync(): Promise<void> {
  await Kernel.removeSessionAsync();
}

// adds a hook for native code to query Home's history.
// needed for routing push notifications in Home.
addListenerWithNativeCallback('ExponentKernel.getHistoryUrlForExperienceId', async (event) => {
  const { experienceId } = event; // scopeKey
  let history = await getHistoryAsync();
  history = history.sort((item1, item2) => {
    // date descending -- we want to pick the most recent experience with this id,
    // in case there are multiple (e.g. somebody was developing against various URLs of the
    // same app)
    const item2time = item2.time ? item2.time : 0;
    const item1time = item1.time ? item1.time : 0;
    return item2time - item1time;
  });
  // TODO(wschurman): only check for scope key in the future when most manifests contain it
  // TODO(wschurman): update for new manifest2 format (Manifest)
  const historyItem = history.find(
    (item) =>
      item.manifest &&
      (item.manifest.id === experienceId ||
        ('scopeKey' in item.manifest && item.manifest.scopeKey === experienceId))
  );
  if (historyItem) {
    return { url: historyItem.url };
  }
  return {};
});

export default {
  clearHistoryAsync,
  getSessionAsync,
  getHistoryAsync,
  getSettingsAsync,
  saveHistoryAsync,
  saveSessionAsync,
  removeSessionAsync,
  updateSettingsAsync,
};
