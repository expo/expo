import Actions from '../actions';
import Auth0Api from '../../api/Auth0Api';
import LocalStorage from '../LocalStorage';

export default async function setAuthTokensAsync({getState}) {
  LocalStorage.saveAuthTokensAsync(getState().authTokens);
}
