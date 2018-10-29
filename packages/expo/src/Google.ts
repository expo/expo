import { Constants } from 'expo-constants';
import { NativeModules, Platform } from 'react-native';

const Google = NativeModules.ExponentGoogle;

type LogInConfig = {
  androidClientId?: string,
  androidStandaloneAppClientId?: string,
  iosClientId?: string,
  iosStandaloneAppClientId?: string,
  webClientId?: string,
  clientId?: string,
  behavior?: 'system' | 'web',
  scopes?: string[],
};

type LogInResult =
  | {
      type: 'cancel',
    }
  | {
      type: 'success',
      accessToken?: string,
      idToken: string | null,
      refreshToken: string | null,
      serverAuthCode: string | null,
      user: {
        id?: string,
        name?: string,
        givenName?: string,
        familyName?: string,
        photoUrl?: string,
        email?: string,
      },
    };

export async function logInAsync(config: LogInConfig): Promise<LogInResult> {
  let behavior = config.behavior;
  if (!behavior) {
    behavior = 'system';
  }

  // Only standalone apps can use system login.
  if (Constants.appOwnership !== 'standalone' && (behavior === 'system' && Platform.OS === "android") ) {
      behavior = 'web';
  }
  

  let scopes = config.scopes;
  if (!scopes) {
    scopes = ['profile', 'email'];
  }

  const androidClientId =
    Constants.appOwnership === 'standalone'
      ? config.androidStandaloneAppClientId
      : config.androidClientId;
  const iosClientId =
    Constants.appOwnership === 'standalone' ? config.iosStandaloneAppClientId : config.iosClientId;

  const logInResult = await Google.logInAsync({
    androidClientId: androidClientId || config.clientId,
    iosClientId: iosClientId || config.clientId,
    webClientId: config.webClientId,
    behavior,
    scopes,
  });

  if (behavior === 'web') {
    // Web login only returns an accessToken so use it to fetch the same info as the native login
    // does.
    let userInfoResponse = await fetch('https://www.googleapis.com/userinfo/v2/me', {
      headers: { Authorization: `Bearer ${logInResult.accessToken}` },
    });
    let userInfo = await userInfoResponse.json();
    return {
      ...logInResult,
      user: {
        id: userInfo.id,
        name: userInfo.name,
        givenName: userInfo.given_name,
        familyName: userInfo.family_name,
        photoUrl: userInfo.picture,
        email: userInfo.email,
      },
    };
  } else {
    return logInResult;
  }
}
