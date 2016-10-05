/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule BrowserActions
 */
'use strict';

import {
  AsyncStorage,
} from 'react-native';

import ExManifests from 'ExManifests';
import { action } from 'Flux';
import StorageKeys from 'StorageKeys';

/**
 * The browser history is stored in AsyncStorage. Its format is:
 *   [{
 *     url: string;
 *     bundleUrl: string;
 *     manifestUrl: string;
 *     manifest: object;
 *     time: number;
 *   }]
 */
let BrowserActions = {
  async navigateToUrlAsync(originalUrl, initialProps = null) {
    try {
      let manifestUrl = originalUrl;
      let { bundleUrl, manifest } = await ExManifests.manifestUrlToBundleUrlAndManifestAsync(manifestUrl);

      // this can happen if fetching a local manifest (e.g. from a developer tool)
      if (!ExManifests.isManifestSdkVersionSupported(manifest)) {
        throw new Error(`This experience uses an unsupported version of Exponent (SDK ${manifest.sdkVersion}). You may need to update Exponent.`);
      }

      return BrowserActions.navigateToBundleUrlAsync(manifestUrl, manifest, bundleUrl, initialProps);
    } catch (e) {
      return BrowserActions.showLoadingError(e.code, e.message, originalUrl);
    }
  },

  async navigateToExperienceIdWithNotificationAsync(experienceId, notificationBody) {
    let history = await loadLocalHistoryAsync();
    let historyItem = history.find(item => (item.manifest && item.manifest.id === experienceId));
    if (historyItem) {
      // don't use the cached manifest, start over
      return BrowserActions.navigateToUrlAsync(historyItem.url, { notification: notificationBody });
    } else {
      // we've never loaded this experience, silently fail
      // (this can happen if the user loads an experience, clears history,
      //  then gets a push for the old experience)
      return BrowserActions.setKernelLoadingState(false);
    }
  },

  async navigateToBundleUrlAsync(manifestUrl, manifest, bundleUrl, initialProps = null) {
    let originalUrl = manifestUrl;
    // originalUrl was a package, not a manifest.
    if (bundleUrl === manifestUrl) {
      manifestUrl = null;
    }

    let historyItem = {
      bundleUrl,
      manifestUrl,
      manifest,
      url: originalUrl,
      time: Date.now(),
    };

    return {
      type: 'navigateToUrlAsync',
      meta: {
        url: originalUrl,
        bundleUrl,
        manifestUrl,
        manifest,
        historyItem,
        initialProps,
      },
      payload: async function() {
        let history = await loadLocalHistoryAsync();
        history = history.filter(item => item.url !== historyItem.url);
        history.unshift(historyItem);
        await AsyncStorage.setItem(StorageKeys.History, JSON.stringify(history));
        return history;
      }(),
    };
  },

  @action
  foregroundUrlAsync(url) {
    return { url };
  },

  @action
  foregroundHomeAsync(clearTasks = false) {
    return { clearTasks };
  },

  @action
  showMenuAsync(isVisible) {
    return { isVisible };
  },

  async setIsNuxFinishedAsync(isFinished) {
    return {
      type: 'setIsNuxFinishedAsync',
      meta: { isFinished },
      payload: async function() {
        await AsyncStorage.setItem(StorageKeys.NuxIsFinished, JSON.stringify(isFinished));
        return isFinished;
      }(),
    };
  },

  @action
  showLoadingError(code, message, originalUrl, manifest = null) {
    return { code, message, originalUrl, manifest };
  },

  @action
  clearTaskWithError(browserTaskUrl) {
    return { url: browserTaskUrl };
  },

  @action
  setKernelLoadingState(isLoading) {
    return { isLoading };
  },

  @action
  setLoadingState(browserTaskUrl, isLoading) {
    return { url: browserTaskUrl, isLoading };
  },

  @action
  setShellPropertiesAsync(isShell, shellManifestUrl) {
    return { isShell, shellManifestUrl };
  },

  @action
  setInitialShellUrl(url) {
    return { url };
  },

  @action
  async loadHistoryAsync() {
    let history = await loadLocalHistoryAsync();
    return { history };
  },

  @action
  async clearHistoryAsync() {
    await AsyncStorage.removeItem(StorageKeys.History);
  },
};

async function loadLocalHistoryAsync() {
  let jsonHistory = await AsyncStorage.getItem(StorageKeys.History);
  if (jsonHistory) {
    try {
      return JSON.parse(jsonHistory);
    } catch (e) {
      console.error(e);
    }
  }
  return [];
}

export default BrowserActions;
