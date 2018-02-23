import LocalStorage from '../storage/LocalStorage';

export default {
  setAuthTokens(tokens) {
    return async (dispatch) => {
      await LocalStorage.saveAuthTokensAsync(tokens);
      return dispatch({
        type: 'setAuthTokens',
        payload: tokens,
      });
    };
  },

  updateIdToken(idToken) {
    return async (dispatch) => {
      await LocalStorage.updateIdTokenAsync(idToken);
      return dispatch({
        type: 'updateIdToken',
        payload: { idToken },
      });
    };
  },

  clearAuthTokens() {
    return async (dispatch) => {
      await LocalStorage.removeAuthTokensAsync();
      return dispatch({
        type: 'clearAuthTokens',
        payload: null,
      });
    };
  },
};
