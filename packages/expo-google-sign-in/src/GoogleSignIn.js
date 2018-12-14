// @flow
import Constants from 'expo-constants';
import { UnavailabilityError } from 'expo-errors';
import invariant from 'invariant';

import ExpoGoogleSignIn from './ExpoGoogleSignIn';
import GoogleUser from './GoogleUser';

import type { GoogleSignInOptions, GoogleSignInAuthResult } from './GoogleSignIn.types';

export const { ERRORS, SCOPES, TYPES } = ExpoGoogleSignIn;

const DEFAULT_SCOPES = [SCOPES.PROFILE, SCOPES.EMAIL];

let _initialization: Promise<void>;
let _options: GoogleSignInOptions = {};
let _currentUser: GoogleUser = null;
let _isClientUsageEnabled = false;

function setCurrentUser(currentUser: GoogleUser | null): GoogleUser | null {
  _currentUser = currentUser;
  return _currentUser;
}

function validateOptions(options: ?GoogleSignInOptions = {}): GoogleSignInOptions {
  if (options.offlineAccess) {
    invariant(
      typeof options.webClientId === 'string' && options.webClientId !== '',
      'GoogleSignIn: Offline access (offlineAccess: true) requires a valid google server id `webClientId`'
    );
  }

  return {
    ...options,
    scopes: options.scopes || DEFAULT_SCOPES,
  };
}

function validateOwnership() {
  invariant(
    _isClientUsageEnabled || Constants.appOwnership !== 'expo',
    'expo-google-sign-in is not supported in the Expo Client because a custom URL scheme is required at build time. Please refer to the docs for usage outside of Expo www.npmjs.com/package/expo-google-sign-in'
  );
}

async function ensureGoogleIsInitializedAsync(options: ?GoogleSignInOptions): Promise<any> {
  if (_initialization == null) {
    return initAsync(options);
  }
  return _initialization;
}

async function invokeAuthMethod(method: string): Promise<GoogleUser | null> {
  if (!ExpoGoogleSignIn[method]) {
    throw new UnavailabilityError('GoogleSignIn', method);
  }
  await ensureGoogleIsInitializedAsync();
  const payload = await ExpoGoogleSignIn[method]();
  let account = payload != null ? new GoogleUser(payload) : null;
  return setCurrentUser(account);
}

export function allowInClient() {
  _isClientUsageEnabled = true;
}

export function getCurrentUser(): GoogleUser | null {
  return _currentUser;
} 

export async function askForPlayServicesAsync(): Promise<boolean> {
  return await getPlayServiceAvailability(true);
}

export async function getPlayServiceAvailability(shouldAsk: boolean = false): Promise<boolean> {
  validateOwnership();

  if (ExpoGoogleSignIn.arePlayServicesAvailableAsync) {
    return await ExpoGoogleSignIn.arePlayServicesAvailableAsync(shouldAsk);
  } else {
    return true;
  }
}

export async function initAsync(options: ?GoogleSignInOptions): Promise<void> {
  if (!ExpoGoogleSignIn.initAsync) {
    throw new UnavailabilityError('GoogleSignIn', 'initAsync');
  }

  _options = validateOptions(options || _options);

  const hasPlayServices = await getPlayServiceAvailability();
  if (!hasPlayServices) {
    return false;
  }

  _initialization = ExpoGoogleSignIn.initAsync(_options);

  return _initialization;
}

export async function isSignedInAsync(): Promise<boolean> {
  const user = await getCurrentUserAsync();
  return user != null;
}

export async function isConnectedAsync(): Promise<boolean> {
  return await ExpoGoogleSignIn.isConnectedAsync();
}

export async function signInSilentlyAsync(): Promise<GoogleUser | null> {
  const isConnected = await isConnectedAsync();
  if (isConnected) {
    try {
      const auth = await invokeAuthMethod('signInSilentlyAsync');
      return auth;
    } catch (error) {
      /* Return null to create parity with Android */
      if (error.code === ERRORS.SIGN_IN_REQUIRED) {
        return null;
      }
      throw error;
    }
  }
  return null;
}

export async function signInAsync(): Promise<GoogleSignInAuthResult> {
  try {
    const user = await invokeAuthMethod('signInAsync');
    return { type: 'success', user };
  } catch (error) {
    if (error.code === ERRORS.SIGN_IN_CANCELLED) {
      return { type: 'cancel', user: null };
    }
    throw error;
  }
}

export async function signOutAsync(): Promise<void> {
  await invokeAuthMethod('signOutAsync');
}

export async function disconnectAsync(): Promise<void> {
  await invokeAuthMethod('disconnectAsync');
}

export async function getCurrentUserAsync(): Promise<GoogleUser | null> {
  return await invokeAuthMethod('getCurrentUserAsync');
}

export async function getPhotoAsync(size: number = 128): Promise<string | null> {
  if (!ExpoGoogleSignIn.getPhotoAsync) {
    throw new UnavailabilityError('GoogleSignIn', 'getPhotoAsync');
  }

  await ensureGoogleIsInitializedAsync();
  return await ExpoGoogleSignIn.getPhotoAsync(size);
}


export { GoogleAuthData } from './GoogleAuthData';
export { GoogleAuthentication } from './GoogleAuthentication';
export { GoogleIdentity } from './GoogleIdentity';
export { GoogleUser } from './GoogleUser';
export { ExpoGoogleSignIn } from './ExpoGoogleSignIn';

export {
  GoogleSignInType,
  GoogleSignInOptions,
  GoogleSignInAuthResultType,
  GoogleSignInAuthResult,
  GoogleSignInPlayServicesOptions,
} from './GoogleSignIn.types';
