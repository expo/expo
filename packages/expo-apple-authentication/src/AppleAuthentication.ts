import { EventEmitter, Subscription, UnavailabilityError } from '@unimodules/core';
import ExpoAppleAuthentication from './ExpoAppleAuthentication';

import {
  AppleAuthenticationSignInOptions,
  AppleAuthenticationRefreshOptions,
  AppleAuthenticationSignOutOptions,
  AppleAuthenticationCredential,
  AppleAuthenticationCredentialState,
  AppleAuthenticationOperation,
  AppleAuthenticationRevokeListener,
} from './AppleAuthentication.types';

export async function isAvailableAsync(): Promise<boolean> {
  if (!ExpoAppleAuthentication || !ExpoAppleAuthentication.isAvailableAsync) {
    return false;
  }
  return ExpoAppleAuthentication.isAvailableAsync();
}

export async function signInAsync(options?: AppleAuthenticationSignInOptions): Promise<AppleAuthenticationCredential> {
  if (!ExpoAppleAuthentication || !ExpoAppleAuthentication.requestAsync) {
    throw new UnavailabilityError('expo-apple-authentication', 'signInAsync');
  }
  const requestOptions = {
    ...(options || {}),
    requestedOperation: AppleAuthenticationOperation.LOGIN,
  };
  return ExpoAppleAuthentication.requestAsync(requestOptions);
}

export async function refreshAsync(options: AppleAuthenticationRefreshOptions): Promise<AppleAuthenticationCredential> {
  if (!ExpoAppleAuthentication || !ExpoAppleAuthentication.requestAsync) {
    throw new UnavailabilityError('expo-apple-authentication', 'refreshAsync');
  }
  const requestOptions = {
    ...options,
    requestedOperation: AppleAuthenticationOperation.REFRESH,
  };
  return ExpoAppleAuthentication.requestAsync(requestOptions);
}

export async function signOutAsync(options: AppleAuthenticationSignOutOptions): Promise<AppleAuthenticationCredential> {
  if (!ExpoAppleAuthentication || !ExpoAppleAuthentication.requestAsync) {
    throw new UnavailabilityError('expo-apple-authentication', 'signOutAsync');
  }
  const requestOptions = {
    ...options,
    requestedOperation: AppleAuthenticationOperation.LOGOUT,
  };
  return ExpoAppleAuthentication.requestAsync(requestOptions);
}

export async function getCredentialStateAsync(user: string): Promise<AppleAuthenticationCredentialState> {
  if (!ExpoAppleAuthentication || !ExpoAppleAuthentication.getCredentialStateAsync) {
    throw new UnavailabilityError('expo-apple-authentication', 'getCredentialStateAsync');
  }
  return ExpoAppleAuthentication.getCredentialStateAsync(user);
}

const ExpoAppleAuthenticationEventEmitter = new EventEmitter(ExpoAppleAuthentication);

export function addRevokeListener(listener: AppleAuthenticationRevokeListener): Subscription {
  return ExpoAppleAuthenticationEventEmitter.addListener('Expo.appleIdCredentialRevoked', listener);
}
