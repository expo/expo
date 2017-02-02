import ActionTypes from '../../constants/ActionTypes';

export default class Actions {
  static setAuthTokens(tokens) {
    return {
      type: ActionTypes.SET_AUTH_TOKENS,
      payload: tokens,
    }
  }

  static updateIdToken(idToken) {
    return {
      type: ActionTypes.UPDATE_ID_TOKEN,
      idToken,
    }
  }

  static signOut() {
    return {
      type: ActionTypes.SIGN_OUT,
    }
  }
}
