import { AppDispatch, AppThunk } from './Store.types';
import LocalStorage from '../storage/LocalStorage';
import { HistoryItem } from '../types';
import { Manifest } from '../types/Manifest';

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
