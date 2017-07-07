/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule BrowserReducer
 */
'use strict';

import AuthTokenActions from 'AuthTokenActions';
import BrowserActions from 'BrowserActions';
import ConsoleActions from 'ConsoleActions';
import Flux from 'Flux';
import Immutable, { List, Map, Record } from 'immutable';

const AuthTokenActionTypes = Flux.getActionTypes(AuthTokenActions);
const BrowserActionTypes = Flux.getActionTypes(BrowserActions);
const ConsoleActionTypes = Flux.getActionTypes(ConsoleActions);
const BrowserState = Record({
  isShell: false,
  shellManifestUrl: null,
  shellInitialUrl: null,
  projectScreenImmediatelyNavigatesToModalNamed: null,
  isHomeVisible: true,
  isMenuVisible: false,
  isNuxFinished: false,
  isKernelLoading: false,
  foregroundTaskUrl: null,
  tasks: Map(),
  history: List(),
  settings: Map(),
});
const LoadingError = Record({
  code: 0,
  message: null,
  originalUrl: null,
  manifest: null,
});
const HistoryItem = Record({
  url: null,
  bundleUrl: null,
  manifestUrl: null,
  manifest: null,
  time: null,
});
const BrowserTask = Record({
  bundleUrl: null,
  manifestUrl: null,
  manifest: null,
  isLoading: false,
  loadingError: null,
  initialProps: null,
});
const Settings = Record({
  legacyMenuGesture: false,
});

export default Flux.createReducer(new BrowserState(), {
  [BrowserActionTypes.navigateToUrlAsync]: {
    begin(state, action) {
      let { url, task } = createImmutableTask(action.meta);

      // remove any existing history item with the same url from the middle of the stack
      // and prepend a new history item.
      let historyItem = new HistoryItem(action.meta.historyItem);
      let history = state.history
        .filter(item => item.url !== historyItem.url)
        .unshift(historyItem);
      return validateBrowserState(
        state.merge({
          isHomeVisible: false,
          isMenuVisible: false,
          foregroundTaskUrl: url,
          tasks: state.tasks.set(url, task),
          history,
        })
      );
    },

    // overwrite the history with the result of the promise in action.payload,
    // which wrote the history to disk async.
    then(state, action) {
      let newHistory = createImmutableHistory(action.payload);
      return state.merge({
        history: newHistory,
      });
    },
    catch(state, action) {
      console.error(action.payload);
      return state.merge({ isKernelLoading: false });
    },
  },

  [BrowserActionTypes.foregroundUrlAsync](state, action) {
    let { url } = action.payload;
    if (url == null || state.tasks.has(url)) {
      return state.merge({
        isHomeVisible: false,
        isMenuVisible: false,
        foregroundTaskUrl: url,
      });
    }
    console.error(
      `Tried to foreground a url not already present in the browser: ${url}`
    );
    return state;
  },

  [BrowserActionTypes.foregroundHomeAsync](state, action) {
    if (state.isShell) {
      console.error(`Tried to foreground Exponent home while in a shell`);
      return state;
    }
    let {
      clearTasks,
      projectScreenImmediatelyNavigatesToModalNamed,
    } = action.payload;
    return state.merge({
      isHomeVisible: true,
      isMenuVisible: false,
      projectScreenImmediatelyNavigatesToModalNamed,
      tasks: clearTasks ? Map() : state.tasks,
    });
  },

  [BrowserActionTypes.showMenuAsync](state, action) {
    let { isVisible } = action.payload;
    return state.merge({ isMenuVisible: isVisible });
  },

  [BrowserActionTypes.setIsNuxFinishedAsync]: {
    begin(state, action) {
      let { isFinished } = action.meta;
      return state.merge({ isNuxFinished: isFinished });
    },
    // overwrite the nux state with the result of the promise in action.payload,
    // which wrote the state to disk async.
    then(state, action) {
      let asyncStorageResult = action.payload;
      return state.merge({
        isNuxFinished: asyncStorageResult,
      });
    },
    catch(state, action) {
      console.error(action.payload);
      return state;
    },
  },

  [BrowserActionTypes.setKernelLoadingState](state, action) {
    let { isLoading } = action.payload;
    return state.merge({ isKernelLoading: isLoading });
  },

  [BrowserActionTypes.setLoadingState](state, action) {
    let { url, isLoading } = action.payload;
    let task = state.tasks.get(url, null);
    if (task) {
      let updatedTasks = state.tasks.set(
        url,
        task.merge({
          isLoading,
          loadingError: isLoading ? null : task.loadingError,
        })
      );
      let loadingTasks = updatedTasks.valueSeq().filter(task => task.isLoading);
      let isAnythingLoading = loadingTasks.size > 0;
      return state.merge({
        isKernelLoading: isAnythingLoading,
        tasks: updatedTasks,
      });
    }
    return state;
  },

  [BrowserActionTypes.setShellPropertiesAsync](state, action) {
    let { isShell, shellManifestUrl } = action.payload;
    // always immediately finish nux if we're a shell app
    let isNuxFinished = isShell ? true : state.isNuxFinished;
    return state.merge({
      isShell,
      isHomeVisible: false,
      isMenuVisible: false,
      isNuxFinished,
      shellManifestUrl,
    });
  },

  [BrowserActionTypes.setInitialShellUrl](state, action) {
    let { url } = action.payload;
    return state.merge({
      shellInitialUrl: url,
    });
  },

  [BrowserActionTypes.loadSettingsAsync]: {
    then(state, action) {
      let { payload } = action;
      let newSettings = createImmutableSettings(payload.settings);

      return state.merge({
        settings: newSettings,
      });
    },
  },

  [BrowserActionTypes.setLegacyMenuGestureAsync]: {
    then(state, action) {
      let { payload } = action;
      let { legacyMenuGesture } = payload;

      let newSettings = state.settings.merge({ legacyMenuGesture });

      return state.merge({
        settings: newSettings,
      });
    },
  },

  [BrowserActionTypes.loadHistoryAsync]: {
    then(state, action) {
      let { payload } = action;
      let newHistory = createImmutableHistory(payload.history);

      return state.merge({
        history: newHistory,
      });
    },
  },

  [BrowserActionTypes.clearImmediatelyLoadingModalName]: {
    then(state, action) {
      let { projectScreenImmediatelyNavigatesToModalNamed } = action;

      return state.merge({
        projectScreenImmediatelyNavigatesToModalNamed,
      });
    },
  },

  [BrowserActionTypes.clearHistoryAsync]: {
    then(state, action) {
      return state.merge({
        history: state.history.clear(),
      });
    },
  },

  [AuthTokenActionTypes.signOut](state, action) {
    return state.merge({
      history: state.history.clear(),
    });
  },

  [BrowserActionTypes.showLoadingError](state, action) {
    let { originalUrl } = action.payload;
    let task = state.tasks.get(originalUrl);
    if (task) {
      task = task.merge({
        isLoading: false,
        initialProps: null,
        loadingError: new LoadingError(action.payload),
      });
    } else {
      task = new BrowserTask({
        manifestUrl: null,
        bundleUrl: null,
        manifest: null,
        isLoading: false,
        initialProps: null,
        loadingError: new LoadingError(action.payload),
      });
    }
    let updatedTasks = state.tasks.set(originalUrl, task);
    let loadingTasks = updatedTasks.valueSeq().filter(task => task.isLoading);
    let isAnythingLoading = loadingTasks.size > 0;

    return validateBrowserState(
      state.merge({
        isHomeVisible: false,
        isMenuVisible: false,
        foregroundTaskUrl: originalUrl,
        isKernelLoading: isAnythingLoading,
        tasks: updatedTasks,
      })
    );
  },

  [BrowserActionTypes.clearTaskWithError](state, action) {
    let task = state.tasks.get(action.payload.url, null);
    if (task) {
      return state.merge({
        isHomeVisible: true,
        isMenuVisible: false,
        foregroundTaskUrl: null,
        tasks: state.tasks.remove(action.payload.url),
      });
    }
    return state;
  },

  [ConsoleActionTypes.logUncaughtError](state, action) {
    let task = state.tasks.get(action.payload.url, null);
    if (task) {
      return state.merge({
        tasks: state.tasks.set(
          action.payload.url,
          task.set('isLoading', false)
        ),
      });
    }
    return state;
  },
});

function createImmutableHistory(history) {
  return new List(history.map(item => new HistoryItem(item)));
}

function createImmutableSettings(settings) {
  return new Settings(settings);
}

function createImmutableTask(meta) {
  let { url, bundleUrl, manifestUrl, manifest, initialProps } = meta;
  return {
    url,
    task: new BrowserTask({
      bundleUrl,
      manifestUrl,
      manifest: Immutable.fromJS(manifest),
      initialProps: Immutable.fromJS(initialProps),
      isLoading: false,
      loadingError: null,
    }),
  };
}

function validateBrowserState(state) {
  let foregroundTaskUrl = state.foregroundTaskUrl;
  if (foregroundTaskUrl) {
    let newTasks = state.tasks.filter(
      (task, url) =>
        url === foregroundTaskUrl ||
        (state.isShell && url === state.shellManifestUrl)
    );
    return state.merge({
      tasks: newTasks,
    });
  }
  return state;
}
