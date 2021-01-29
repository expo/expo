import ApiV2HttpClient from './ApiV2HttpClient';

type SignInResult = {
  id: string;
  sessionSecret: string;
};

export async function signInAsync(
  username: string,
  password: string,
  otp?: string
): Promise<SignInResult> {
  const api = new ApiV2HttpClient();
  return await api.postAsync('auth/loginAsync', {
    username,
    password,
    otp,
  });
}

export async function sendSMSOTPAsync(
  username: string,
  password: string,
  secondFactorDeviceID: string
): Promise<void> {
  const api = new ApiV2HttpClient();
  await api.postAsync('auth/send-sms-otp', {
    username,
    password,
    secondFactorDeviceID,
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
  sendSMSOTPAsync,
  signOutAsync,
  signUpAsync,
};
