/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule Browser
 */
'use strict';

import BrowserActions from 'BrowserActions';
import ExManifests from 'ExManifests';
import ExStore from 'ExStore';
import { EventEmitter } from 'fbemitter';
import LocalStorage from 'LocalStorage';

let _navigationRequestId = 0;
let _isFetchingManifest = {};
let _isLoadingCancelled = {};

function _cleanupNavigationRequest(navigationRequestId) {
  delete _isFetchingManifest[navigationRequestId];
  delete _isLoadingCancelled[navigationRequestId];
}

async function _fetchManifestAsync(url) {
  let navigationRequestId = _navigationRequestId;
  _isFetchingManifest[navigationRequestId] = true;
  let result = await ExManifests.manifestUrlToBundleUrlAndManifestAsync(url);
  _isFetchingManifest[navigationRequestId] = false;
  return result;
}

let emitter = new EventEmitter();

let Browser = {
  refresh() {
    emitter.emit('refresh');
  },

  addRefreshListener(listener) {
    return emitter.addListener('refresh', listener);
  },

  cancelLoadingMostRecentManifestRequest() {
    if (!_isFetchingManifest[_navigationRequestId]) {
      throw new Error('Already finished fetching manifest, cancellation is not possible');
    }

    _isLoadingCancelled[_navigationRequestId] = true;
    ExStore.dispatch(BrowserActions.setKernelLoadingState(false));
  },

  async navigateToUrlAsync(manifestUrl, initialProps = null) {
    try {
      let navigationRequestId = ++_navigationRequestId;

      let isCancelled = _isLoadingCancelled[navigationRequestId];
      _cleanupNavigationRequest(navigationRequestId);

      if (isCancelled) {
        return;
      }

      ExStore.dispatch(BrowserActions.navigateToUrlAsync(manifestUrl, initialProps));
      const { manifest, bundleUrl } = await _fetchManifestAsync(manifestUrl);
      ExStore.dispatch(BrowserActions.loadBundleAsync(manifestUrl, manifest, bundleUrl));
    } catch (e) {
      ExStore.dispatch(
        BrowserActions.showLoadingError(e.code, e.message, manifestUrl, null, e.userInfo)
      );
    }
  },

  async navigateToExperienceIdWithNotificationAsync(experienceId, notificationBody) {
    let history = await LocalStorage.getHistoryAsync();
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
      // don't use the cached manifest, start over
      return Browser.navigateToUrlAsync(historyItem.url, {
        notification: notificationBody,
      });
    } else {
      // we've never loaded this experience, silently fail
      // (this can happen if the user loads an experience, clears history,
      //  then gets a push for the old experience)
      ExStore.dispatch(BrowserActions.setKernelLoadingState(false));
    }
  },
};

export default Browser;
