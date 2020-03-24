import { CodedError } from '@unimodules/core';
import * as AppAuth from 'expo-app-auth';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const isInExpo = Constants.appOwnership === 'expo';
export type GoogleLogInConfig = {
  androidClientId?: string;
  iosClientId?: string;
  androidStandaloneAppClientId?: string;
  iosStandaloneAppClientId?: string;
  /** Deprecated: You will need to use expo-google-sign-in to do server side authentication outside of the Expo client */
  webClientId?: string;
  /**
   * System authentication is very different from web auth.
   * All system functionality has been moved to expo-google-sign-in
   */
  behavior?: 'system' | 'web';
  scopes?: string[];
  /**
   * Optionally you can define your own redirect URL.
   * If this isn't defined then it will be infered from the correct client ID.
   */
  redirectUrl: string;
  /**
   * Language for the sign in UI, in the form of ISO 639-1 language code optionally followed by a dash
   * and ISO 3166-1 alpha-2 region code, such as 'it' or 'pt-PT'.
   * Only set this value if it's different from the system default (which you can access via expo-localization).
   */
  language?: string;
  /**
   * If the user's email address is known ahead of time, it can be supplied to be the default option.
   * If the user has approved access for this app in the past then auth may return without any further interaction.
   */
  accountName?: string;
  /* If no other client IDs are defined this will be used. */
  clientId?: string;
};

export type GoogleUser = {
  id?: string;
  name?: string;
  givenName?: string;
  familyName?: string;
  photoUrl?: string;
  email?: string;
};

export type LogInResult =
  | {
      type: 'cancel';
    }
  | {
      type: 'success';
      accessToken: string | null;
      idToken: string | null;
      refreshToken: string | null;
      user: GoogleUser;
    };

function getPlatformGUID(config: GoogleLogInConfig) {
  const { clientId } = config;

  const iosClientId =
    Constants.appOwnership === 'standalone' ? config.iosStandaloneAppClientId : config.iosClientId;
  const androidClientId = isInExpo ? config.androidClientId : config.androidStandaloneAppClientId;

  const platformClientId =
    Platform.select({
      ios: iosClientId,
      android: androidClientId,
      default: config.clientId,
    }) || clientId;

  if (
    typeof iosClientId === 'string' &&
    typeof androidClientId === 'string' &&
    iosClientId === androidClientId
  ) {
    throw new CodedError(
      'ERR_GOOGLE_CONFIG',
      'Keys for Android and iOS cannot be the same value. Ensure you are linking the client IDs matching the given platforms in the Google APIs console: https://console.developers.google.com/apis/credentials'
    );
  }

  if (!platformClientId) {
    throw new CodedError(
      'ERR_GOOGLE_CONFIG',
      'Please provide the appropriate client ID. See the documentation for more details https://docs.expo.io/versions/latest/sdk/google/#loginasync'
    );
  }

  const guid = guidFromClientId(platformClientId);
  return guid;
}

const PROJECT_ID_LENGTH = 32;

function isValidGUID(guid: string) {
  const components = guid.split('-');
  if (components.length !== 2) {
    return {
      isValid: false,
      reason: `\`${guid}\` must be a string of numbers and an alphanumeric string ${PROJECT_ID_LENGTH} characters long, joined with a hyphen.`,
    };
  }
  const projectNumber = components[0];
  const projectId = components[1];
  if (isNaN(+projectNumber)) {
    const hashedProjectId = Array(PROJECT_ID_LENGTH).fill('x');
    return {
      isValid: false,
      reason: `\`${projectNumber}-${hashedProjectId}\` project number must be a string of numbers.`,
    };
  }
  if (!projectId.match('^[a-zA-Z0-9]+$')) {
    const hashedProjectNumber = Array(projectNumber.length).fill('x');
    return {
      isValid: false,
      reason: `\`${hashedProjectNumber}-${projectId}\` project ID must be an alphanumeric string ${PROJECT_ID_LENGTH} characters long.`,
    };
  }

  return { isValid: true };
}

function guidFromClientId(clientId: string): string {
  const clientIdComponents = clientId.split('.').filter(component => component.includes('-'));

  const guid = clientIdComponents[0];
  const { isValid, reason } = isValidGUID(guid);
  if (!isValid) {
    throw new CodedError(
      'ERR_GOOGLE_GUID',
      reason + ' Please ensure you copied the client ID correctly.'
    );
  }

  return guid;
}

export async function logInAsync(config: GoogleLogInConfig): Promise<LogInResult> {
  if (config.behavior !== undefined) {
    console.warn(
      "Deprecated: Native Google Sign-In has been moved to Expo.GoogleSignIn ('expo-google-sign-in') Falling back to `web` behavior. `behavior` deprecated in SDK 34"
    );
  }

  if (config.webClientId !== undefined) {
    console.warn(
      'Deprecated: You will need to use expo-google-sign-in to do server side authentication outside of the Expo client'
    );
  }

  const guid = getPlatformGUID(config);

  const clientId = `${guid}.apps.googleusercontent.com`;
  const redirectUri = config.redirectUrl;

  try {
    const serviceConfiguration = await AppAuth.ExpoAuthorizationServiceConfiguration.fetchFromIssuer(
      'https://accounts.google.com'
    );

    const extras: Record<string, string> = {};
    if (config.language) {
      // The OpenID property `ui_locales` doesn't seem to work as expected,
      // but `hl` will work to change the UI language.
      // Reference: https://github.com/googleapis/google-api-nodejs-client/blob/9d0dd2b6fa03c5e32efb0e39daac6291ebad2c3d/src/apis/customsearch/v1.ts#L230
      extras.hl = config.language;
    }
    if (config.accountName) {
      // Reference https://openid.net/specs/openid-connect-core-1_0.html#AuthRequest
      extras.login_hint = config.accountName;
    }

    const logInResult = await AppAuth.authAsync(
      {
        clientId,
        redirectUri,
        scopes: applyDefaultsToScopes(config.scopes),
        extras,
      },
      serviceConfiguration
    );

    // Web login only returns an accessToken so use it to fetch the same info as the native login
    // does.
    const userInfoResponse = await fetch(
      serviceConfiguration.userInfoEndpoint ?? 'https://www.googleapis.com/userinfo/v2/me',
      {
        headers: { Authorization: `Bearer ${logInResult.accessToken}` },
      }
    );
    const userInfo = await userInfoResponse.json();

    return {
      type: 'success',
      accessToken: logInResult.accessToken,
      idToken: logInResult.idToken!,
      refreshToken: logInResult.refreshToken!,
      user: {
        id: userInfo.id,
        name: userInfo.name,
        givenName: userInfo.given_name,
        familyName: userInfo.family_name,
        photoUrl: userInfo.picture,
        email: userInfo.email,
      },
    };
  } catch (error) {
    // TODO: Bacon: Make this work with the new app auth API
    if (error.message.toLowerCase().indexOf('user cancelled') > -1) {
      return { type: 'cancel' };
    }
    throw error;
  }
}

function applyDefaultsToScopes(scopes: string[] = []): string[] {
  /* Add the required scopes for returning profile data. */
  const requiredScopes = [...scopes, 'profile', 'email', 'openid'];
  /* Remove duplicates */
  return [...new Set(requiredScopes)];
}

export async function logOutAsync({
  accessToken,
  ...inputConfig
}: GoogleLogInConfig & { accessToken: string }): Promise<any> {
  const guid = getPlatformGUID(inputConfig);

  const clientId = `${guid}.apps.googleusercontent.com`;

  await AppAuth.revokeAsync(
    {
      clientId,
      token: accessToken,
      tokenTypeHint: 'access_token',
    },
    'https://accounts.google.com'
  );
}
