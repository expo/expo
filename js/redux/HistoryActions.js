import LocalStorage from '../storage/LocalStorage';

// TODO: adding items to history
// (once we have native bundle loading / navigation working)

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
}
