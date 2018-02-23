import AuthTokenActions from './AuthTokenActions';
import { Record } from 'immutable';

const AuthTokenState = Record({
  idToken: null,
  refreshToken: null,
  accessToken: null,
});

export default (state, action) => {
  switch (action.type) {
  case 'setAuthTokens':
    return new AuthTokenState(action.payload);
  case 'updateIdToken':
    return state.set('idToken', action.payload.idToken);
  case 'clearAuthTokens':
    return new AuthTokenState();
  default:
    return (state) ? state : new AuthTokenState();
  }
};
