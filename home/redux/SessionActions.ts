import Analytics from '../api/Analytics';
import LocalStorage from '../storage/LocalStorage';
import ApolloClient from '../api/ApolloClient';
import AuthApi from '../api/AuthApi';

export default {
  setSession(session) {
    return async dispatch => {
      await LocalStorage.saveSessionAsync(session);
      return dispatch({
        type: 'setSession',
        payload: session,
      });
    };
  },

  signOut({ retainApolloStore = false } = {}) {
    return async dispatch => {
      const session = await LocalStorage.getSessionAsync();
      if (session) {
        await AuthApi.signOutAsync(session.sessionSecret);
        await LocalStorage.removeSessionAsync();
        Analytics.track(Analytics.events.USER_LOGGED_OUT);
      }

      await LocalStorage.clearHistoryAsync();

      Analytics.identify(null);
      if (!retainApolloStore) {
        ApolloClient.resetStore();
      }

      return dispatch({
        type: 'signOut',
        payload: null,
      });
    };
  },
};
