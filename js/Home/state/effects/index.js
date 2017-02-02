import ActionTypes from '../../constants/ActionTypes';
import setAuthTokensAsync from './setAuthTokensAsync';
import signOutAsync from './signOutAsync';

export default [
  {action: ActionTypes.SET_AUTH_TOKENS, effect: setAuthTokensAsync},
  {action: ActionTypes.UPDATE_ID_TOKEN, effect: setAuthTokensAsync},
  {action: ActionTypes.SIGN_OUT, effect: signOutAsync},
];
