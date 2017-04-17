/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule BrowserActions
 */
'use strict';

import { action } from 'Flux';
import ExManifests from 'ExManifests';
import ExponentKernel from 'ExponentKernel';
import LocalStorage from 'LocalStorage';

let _navigationRequestId = 0;
let _isFetchingManifest = {};
let _isLoadingCancelled = {};

async function _fetchManifestAsync(url) {
  let navigationRequestId = _navigationRequestId;
  _isFetchingManifest[navigationRequestId] = true;
  let result = await ExManifests.manifestUrlToBundleUrlAndManifestAsync(url);
  _isFetchingManifest[navigationRequestId] = false;
  return result;
}

function _cleanupNavigationRequest(navigationRequestId) {
  delete _isFetchingManifest[navigationRequestId];
  delete _isLoadingCancelled[navigationRequestId];
}

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
  cancelLoadingMostRecentManifestRequest() {
    if (!_isFetchingManifest[_navigationRequestId]) {
      throw new Error(
        'Already finished fetching manifest, cancellation is not possible'
      );
    }

    _isLoadingCancelled[_navigationRequestId] = true;
    return BrowserActions.setKernelLoadingState(false);
  },

  async navigateToUrlAsync(manifestUrl, initialProps = null) {
    try {
      let navigationRequestId = ++_navigationRequestId;
      let { bundleUrl, manifest } = await _fetchManifestAsync(manifestUrl);

      let isCancelled = _isLoadingCancelled[navigationRequestId];
      _cleanupNavigationRequest(navigationRequestId);

      if (isCancelled) {
        return {};
      }

      if (!ExManifests.isManifestSdkVersionSupported(manifest)) {
        throw new Error(
          `This experience uses an unsupported version of Expo (SDK ${manifest.sdkVersion}). You may need to update Expo Client on your device.`
        );
      }

      return BrowserActions.navigateToBundleUrlAsync(
        manifestUrl,
        manifest,
        bundleUrl,
        initialProps
      );
    } catch (e) {
      return BrowserActions.showLoadingError(e.code, e.message, manifestUrl);
    }
  },

  async navigateToExperienceIdWithNotificationAsync(
    experienceId,
    notificationBody
  ) {
    let history = await LocalStorage.getHistoryAsync();
    history = history.sort((item1, item2) => {
      // date descending -- we want to pick the most recent experience with this id,
      // in case there are multiple (e.g. somebody was developing against various URLs of the
      // same app)
      let item2time = item2.time ? item2.time : 0;
      let item1time = item1.time ? item1.time : 0;
      return item2time - item1time;
    });
    let historyItem = history.find(
      item => item.manifest && item.manifest.id === experienceId
    );
    if (historyItem) {
      // don't use the cached manifest, start over
      return BrowserActions.navigateToUrlAsync(historyItem.url, {
        notification: notificationBody,
      });
    } else {
      // we've never loaded this experience, silently fail
      // (this can happen if the user loads an experience, clears history,
      //  then gets a push for the old experience)
      return BrowserActions.setKernelLoadingState(false);
    }
  },

  async navigateToBundleUrlAsync(
    manifestUrl,
    manifest,
    bundleUrl,
    initialProps = null
  ) {
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
      payload: (async function() {
        let history = await LocalStorage.getHistoryAsync();
        history = history.filter(item => item.url !== historyItem.url);
        history.unshift(historyItem);
        await LocalStorage.saveHistoryAsync(history);
        return history;
      })(),
    };
  },

  @action foregroundUrlAsync(url) {
    return { url };
  },

  @action foregroundHomeAsync(clearTasks = false) {
    return { clearTasks };
  },

  @action showMenuAsync(isVisible) {
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

  @action showLoadingError(code, message, originalUrl, manifest = null) {
    return { code, message, originalUrl, manifest };
  },

  @action clearTaskWithError(browserTaskUrl) {
    return { url: browserTaskUrl };
  },

  @action setKernelLoadingState(isLoading) {
    return { isLoading };
  },

  @action setLoadingState(browserTaskUrl, isLoading) {
    return { url: browserTaskUrl, isLoading };
  },

  @action setShellPropertiesAsync(isShell, shellManifestUrl) {
    return { isShell, shellManifestUrl };
  },

  @action setInitialShellUrl(url) {
    return { url };
  },

  @action async loadHistoryAsync() {
    let history = await LocalStorage.getHistoryAsync();
    return { history };
  },

  @action async loadSettingsAsync() {
    let settings = await LocalStorage.getSettingsAsync();

    if (settings.legacyMenuGesture) {
      try {
        await ExponentKernel.setIsLegacyMenuBehaviorEnabledAsync(
          useLegacyGesture
        );
      } catch (e) {}
    }

    return { settings };
  },

  @action async setLegacyMenuGestureAsync(useLegacyGesture) {
    try {
      await Promise.all([
        ExponentKernel.setIsLegacyMenuBehaviorEnabledAsync(useLegacyGesture),
        LocalStorage.updateSettingsAsync({
          legacyMenuGesture: useLegacyGesture,
        }),
      ]);
    } catch (e) {
      alert(
        'Oops, something went wrong and we were unable to change the gesture type!'
      );
      return { legacyMenuGesture: !useLegacyGesture };
    }

    return { legacyMenuGesture: useLegacyGesture };
  },

  @action async clearHistoryAsync() {
    await LocalStorage.clearHistoryAsync();
  },
};

export default BrowserActions;
