import ApiV2HttpClient from './ApiV2HttpClient';

type SignInResult = {
  sessionSecret: boolean;
};

export async function signInAsync(username: string, password: string): Promise<SignInResult> {
  const api = new ApiV2HttpClient();
  return await api.postAsync('auth/loginAsync', {
    username,
    password,
  });
}

export async function signOutAsync(sessionSecret: string | null): Promise<void> {
  if (!sessionSecret) {
    return;
  }

  const api = new ApiV2HttpClient();
  await api.postAsync('auth/logout');
}

type SignUpData = {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
};

type SignUpResult = {
  user: {
    id: string;
    username: string;
    email: string;
    [key: string]: any;
  };
};

export async function signUpAsync(data: SignUpData): Promise<SignUpResult> {
  const api = new ApiV2HttpClient();
  return await api.postAsync('auth/createOrUpdateUser', {
    userData: {
      connection: 'Username-Password-Authentication',
      email: data.email,
      password: data.password,
      username: data.username,
      given_name: data.firstName,
      family_name: data.lastName,
    },
  });
}

export default {
  signInAsync,
  signOutAsync,
  signUpAsync,
};
