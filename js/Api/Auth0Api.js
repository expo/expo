/* @flow */

import jwtDecode from 'jwt-decode';
import { Constants } from 'expo';

const AuthScope = 'openid offline_access nickname username';
const AuthEndpoint = 'https://exponent.auth0.com/oauth/ro';
const DelegationEndpoint = 'https://exponent.auth0.com/delegation';
const SignUpEndpoint = 'https://exp.host/--/api/v2/auth/createOrUpdateUser';
const ClientId = 'qIdMWQxxXqD8PbCA90mZh0r2djqJylzg';

async function signInAsync(username: string, password: string) {
  let response = await fetch(AuthEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: ClientId,
      username,
      password,
      device: Constants.deviceId,
      connection: 'Username-Password-Authentication',
      scope: AuthScope,
    }),
  });

  let result = await response.json();
  return result;
}

type SignUpData = {
  firstName: string,
  lastName: string,
  email: string,
  username: string,
  password: string,
};

async function signUpAsync(data: SignUpData) {
  let response = await fetch(SignUpEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userData: {
        client_id: ClientId,
        connection: 'Username-Password-Authentication',
        email: data.email,
        password: data.password,
        username: data.username,
        user_metadata: {
          onboarded: true,
          given_name: data.firstName,
          family_name: data.lastName,
        },
      },
    }),
  });

  let result = await response.json();
  return result;
}

function tokenIsExpired(idToken: string) {
  const { exp } = jwtDecode(idToken, { complete: true });

  return exp - new Date().getTime() / 1000 <= 60 * 60;
}

async function refreshIdTokenAsync(refreshToken: string) {
  let response = await fetch(DelegationEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      refresh_token: refreshToken,
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      api_type: 'app',
      scope: AuthScope,
      client_id: ClientId,
      target: ClientId,
    }),
  });

  let result = await response.json();
  return result;
}

export default {
  signInAsync,
  signUpAsync,
  refreshIdTokenAsync,
  tokenIsExpired,
};
