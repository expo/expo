import Analytics from '../api/Analytics';
import LocalStorage from '../storage/LocalStorage';
import ApolloClient from '../api/ApolloClient';
import AuthApi from '../api/AuthApi';

export default {
  setSession(session) {
    return async (dispatch) => {
      await LocalStorage.saveSessionAsync(session);
      return dispatch({
        type: 'setSession',
        payload: session,
      });
    };
  },

  signOut(options = {}) {
    return async (dispatch) => {
      const shouldResetApolloStore = options.shouldResetApolloStore || true;
      const session = await LocalStorage.getSessionAsync();
      if (session) {
        await AuthApi.signOutAsync(session.sessionSecret);
      }
      await LocalStorage.removeSessionAsync();
      await LocalStorage.clearHistoryAsync();

      Analytics.track(Analytics.events.USER_LOGGED_OUT);
      Analytics.identify(null);
      if (shouldResetApolloStore) {
        ApolloClient.resetStore();
      }

      return dispatch({
        type: 'signOut',
        payload: null,
      });
    };
  },
};
