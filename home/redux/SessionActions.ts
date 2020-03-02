import Analytics from '../api/Analytics';
import ApolloClient from '../api/ApolloClient';
import AuthApi from '../api/AuthApi';
import LocalStorage from '../storage/LocalStorage';

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
        try {
          await AuthApi.signOutAsync(session.sessionSecret);
        } catch (e) {
          // continue to clear out session in redux and local storage even if API logout fails
          console.error('Something went wrong when signing out:', e);
        }
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
