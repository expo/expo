import LocalStorage from '../storage/LocalStorage';
import { HistoryItem } from '../types';
import { Manifest } from '../types/Manifest';
import { AppDispatch, AppThunk } from './Store.types';

export default {
  loadHistory(): AppThunk {
    return async (dispatch: AppDispatch) => {
      const history = await LocalStorage.getHistoryAsync();
      return dispatch({
        type: 'loadHistory',
        payload: { history },
      });
    };
  },

  clearHistory(): AppThunk {
    return async (dispatch: AppDispatch) => {
      await LocalStorage.clearHistoryAsync();
      return dispatch({
        type: 'clearHistory',
      });
    };
  },

  addHistoryItem(manifestUrl: string, manifest: Manifest): AppThunk {
    return async (dispatch: AppDispatch) => {
      const historyItem: HistoryItem = {
        // TODO(wschurman): audit for new manifests
        bundleUrl: manifest && 'bundleUrl' in manifest ? manifest.bundleUrl : '',
        manifestUrl,
        manifest,
        url: manifestUrl,
        time: Date.now(),
      };

      let history = await LocalStorage.getHistoryAsync();
      history = history.filter((item) => item.url !== historyItem.url);
      history.unshift(historyItem);
      await LocalStorage.saveHistoryAsync(history);

      return dispatch({
        type: 'loadHistory',
        payload: { history },
      });
    };
  },
};
