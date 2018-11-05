import LocalStorage from '../storage/LocalStorage';

export default {
  loadHistory() {
    return async (dispatch) => {
      const history = await LocalStorage.getHistoryAsync();
      return dispatch({
        type: 'loadHistory',
        payload: { history },
      });
    };
  },

  clearHistory() {
    return async (dispatch) => {
      await LocalStorage.clearHistoryAsync();
      return dispatch({
        type: 'clearHistory',
      });
    };
  },

  addHistoryItem(manifestUrl, manifest) {
    return async (dispatch) => {
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
    }
  },
}
