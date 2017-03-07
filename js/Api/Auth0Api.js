/* @flow */

import jwtDecode from 'jwt-decode';
import { Constants } from 'expo';

const AuthScope = 'openid offline_access nickname username';
const AuthEndpoint = 'https://exponent.auth0.com/oauth/ro';
const ProfileEndpoint = 'https://exponent.auth0.com/userinfo';
const DelegationEndpoint = 'https://exponent.auth0.com/delegation';
const SignUpEndpoint = 'https://exp.host/--/api/v2/auth/createOrUpdateUser';
const ClientId = 'qIdMWQxxXqD8PbCA90mZh0r2djqJylzg';

async function signInAsync(username, password) {
  let response = await fetch(AuthEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      'client_id': ClientId,
      'username': username,
      'password': password,
      'device': Constants.deviceId,
      'connection': 'Username-Password-Authentication',
      'scope': AuthScope,
    })
  });

  let result = await response.json();
  return result;
}

async function signUpAsync(data) {
  let response = await fetch(SignUpEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      'userData': {
        'client_id': ClientId,
        'connection': 'Username-Password-Authentication',
        'email': data.email,
        'password': data.password,
        'username': data.username,
        'user_metadata': {
          'onboarded': true,
          'given_name': data.firstName,
          'family_name': data.lastName,
        },
      }
    })
  });


  let result = await response.json();
  return result;
}

async function fetchUserProfileAsync(token) {
  let response = await fetch(ProfileEndpoint, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  let result = await response.json();
  return result;
}

function tokenIsExpired(idToken) {
  const { exp } = jwtDecode(idToken, { complete: true });

  return exp - ((new Date()).getTime() / 1000) <= 60 * 60;
}

async function refreshIdTokenAsync(refreshToken) {
  let response = await fetch(DelegationEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      'refresh_token': refreshToken,
      'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      'api_type': 'app',
      'scope': AuthScope,
      'client_id': ClientId,
      'target': ClientId,
    })
  });

  let result = await response.json();
  return result;
}

export default {
  signInAsync,
  signUpAsync,
  fetchUserProfileAsync,
  refreshIdTokenAsync,
  tokenIsExpired,
}
