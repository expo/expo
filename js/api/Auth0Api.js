/* @flow */
import ApiV2HttpClient from 'ApiV2HttpClient';

const SignUpEndpoint = 'https://exp.host/--/api/v2/auth/createOrUpdateUser';
const SignOutEndpoint = 'https://exp.host/--/api/v2/auth/logoutAsync';

type SignInOptions = {
  testSession?: boolean,
};
async function signInAsync(username: string, password: string, options: SignInOptions = {}) {
  let testSession = options.testSession || false;
  let api = new ApiV2HttpClient();
  return api.postAsync('auth/loginAsync', {
    username,
    password,
    ...(testSession ? { testSession } : {}),
  });
}

async function signOutAsync(sessionSecret) {
  if (!sessionSecret) {
    return;
  }
  await fetch(SignOutEndpoint, {
    method: 'POST',
    headers: {
      'Expo-Session': sessionSecret,
    },
  });
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
        connection: 'Username-Password-Authentication',
        email: data.email,
        password: data.password,
        username: data.username,
        given_name: data.firstName,
        family_name: data.lastName,
      },
    }),
  });

  let result = await response.json();
  return result;
}

export default {
  signInAsync,
  signOutAsync,
  signUpAsync,
};
