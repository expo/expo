/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule BrowserActions
 */

import { action } from 'Flux';
import Browser from 'Browser';
import ExManifests from 'ExManifests';
import ExponentKernel from 'ExponentKernel';
import LocalStorage from 'LocalStorage';

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
  async navigateToUrlAsync(manifestUrl, initialProps = null) {
    let originalUrl = manifestUrl;

    return {
      type: 'navigateToUrlAsync',
      payload: {
        url: originalUrl,
        manifestUrl,
        initialProps,
      },
    };
  },

  async loadBundleAsync(manifestUrl, manifest, bundleUrl) {
    let historyItem = {
      bundleUrl,
      manifestUrl,
      manifest,
      url: manifestUrl,
      time: Date.now(),
    };

    if (!ExManifests.isManifestSdkVersionSupported(manifest)) {
      throw new Error(
        `This experience uses an unsupported version of Expo (SDK ${manifest.sdkVersion}). You may need to update Expo Client on your device.`
      );
    }

    return {
      type: 'loadBundleAsync',
      meta: { manifestUrl, manifest, bundleUrl, historyItem },
      payload: (async function() {
        let history = await LocalStorage.getHistoryAsync();
        history = history.filter(item => item.url !== historyItem.url);
        history.unshift(historyItem);
        await LocalStorage.saveHistoryAsync(history);
        return history;
      })(),
    };
  },

  @action
  foregroundUrlAsync(url) {
    return { url };
  },

  @action
  foregroundHomeAsync(options = {}) {
    const { clearTasks = false, projectScreenImmediatelyNavigatesToModalNamed } = options;
    return { clearTasks, projectScreenImmediatelyNavigatesToModalNamed };
  },

  @action
  showMenuAsync(isVisible) {
    return { isVisible };
  },

  async setIsNuxFinishedAsync(isFinished) {
    return {
      type: 'setIsNuxFinishedAsync',
      meta: { isFinished },
      payload: (async function() {
        await LocalStorage.saveIsNuxFinishedAsync(isFinished);
        return isFinished;
      })(),
    };
  },

  @action
  showLoadingError(code, message, originalUrl, manifest = null, userInfo = null) {
    return { code, message, originalUrl, manifest, userInfo };
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
    let history = await LocalStorage.getHistoryAsync();
    return { history };
  },

  @action
  async loadSettingsAsync() {
    let settings = await LocalStorage.getSettingsAsync();

    if (settings && settings.legacyMenuGesture) {
      try {
        await ExponentKernel.setIsLegacyMenuBehaviorEnabledAsync(true);
      } catch (e) {
        // todo: log error to backend
      }
    }

    return { settings };
  },

  @action
  async clearImmediatelyLoadingModalName() {
    return { projectScreenImmediatelyNavigatesToModalNamed: null };
  },

  @action
  async setLegacyMenuGestureAsync(useLegacyGesture) {
    try {
      await Promise.all([
        ExponentKernel.setIsLegacyMenuBehaviorEnabledAsync(useLegacyGesture),
        LocalStorage.updateSettingsAsync({
          legacyMenuGesture: useLegacyGesture,
        }),
      ]);
    } catch (e) {
      alert('Oops, something went wrong and we were unable to change the gesture type!');
      return { legacyMenuGesture: !useLegacyGesture };
    }

    return { legacyMenuGesture: useLegacyGesture };
  },

  @action
  async clearHistoryAsync() {
    await LocalStorage.clearHistoryAsync();
  },
};

export default BrowserActions;
