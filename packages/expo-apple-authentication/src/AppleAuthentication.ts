import { EventEmitter, Subscription, UnavailabilityError } from '@unimodules/core';
import ExpoAppleAuthentication from './ExpoAppleAuthentication';

import {
  AppleAuthenticationLoginOptions,
  AppleAuthenticationRefreshOptions,
  AppleAuthenticationLogoutOptions,
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

export async function loginAsync(options: AppleAuthenticationLoginOptions): Promise<AppleAuthenticationCredential> {
  if (!ExpoAppleAuthentication || !ExpoAppleAuthentication.requestAsync) {
    throw new UnavailabilityError('expo-apple-authentication', 'loginAsync');
  }
  const requestOptions = {
    ...options,
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

export async function logoutAsync(options: AppleAuthenticationLogoutOptions): Promise<AppleAuthenticationCredential> {
  if (!ExpoAppleAuthentication || !ExpoAppleAuthentication.requestAsync) {
    throw new UnavailabilityError('expo-apple-authentication', 'logoutAsync');
  }
  const requestOptions = {
    ...options,
    requestedOperation: AppleAuthenticationOperation.LOGOUT,
  };
  return ExpoAppleAuthentication.requestAsync(requestOptions);
}

export async function getCredentialStateAsync(userId: string): Promise<AppleAuthenticationCredentialState> {
  if (!ExpoAppleAuthentication || !ExpoAppleAuthentication.getCredentialStateAsync) {
    throw new UnavailabilityError('expo-apple-authentication', 'getCredentialStateAsync');
  }
  return ExpoAppleAuthentication.getCredentialStateAsync(userId);
}

const ExpoAppleAuthenticationEventEmitter = new EventEmitter(ExpoAppleAuthentication);

export function addRevokeListener(listener: AppleAuthenticationRevokeListener): Subscription {
  return ExpoAppleAuthenticationEventEmitter.addListener('Expo.appleIdCredentialRevoked', listener);
}
