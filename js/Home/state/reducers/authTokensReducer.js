import ActionTypes from '../../constants/ActionTypes';

export default (state, action) => {
  if (action.type === ActionTypes.SET_AUTH_TOKENS) {
    console.log(action.payload.idToken);
    return action.payload;
  } else if (action.type === ActionTypes.UPDATE_ID_TOKEN) {
    return {...state, idToken: action.idToken};
  } else if (action.type === ActionTypes.SIGN_OUT) {
    return null;
  } else {
    return state || null;
  }
}
