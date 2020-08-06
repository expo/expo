import LocalStorage from '../storage/LocalStorage';
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

  addHistoryItem(manifestUrl: string, manifest: Record<string, any>): AppThunk {
    return async (dispatch: AppDispatch) => {
      const historyItem = {
        bundleUrl: manifest.bundleUrl,
        manifestUrl,
        manifest,
        url: manifestUrl,
        time: Date.now(),
      };

      let history = await LocalStorage.getHistoryAsync();
      history = history.filter(item => item.url !== historyItem.url);
      history.unshift(historyItem);
      await LocalStorage.saveHistoryAsync(history);

      return dispatch({
        type: 'loadHistory',
        payload: { history },
      });
    };
  },
};
