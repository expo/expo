import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useMemo } from 'react';
import { Platform } from 'react-native';

import { AuthSessionRedirectUriOptions } from '../AuthSession';

export function applyRequiredScopes(scopes: string[] = [], requiredScopes: string[]): string[] {
  // Add the required scopes for returning profile data.
  // Remove duplicates
  return [...new Set([...scopes, ...requiredScopes])];
}

// Only natively in the Expo client.
export function shouldUseProxy(): boolean {
  return Platform.select({
    web: false,
    // Use the proxy in the Expo client.
    default: Constants.executionEnvironment === ExecutionEnvironment.StoreClient,
  });
}

export function invariantClientId(idName: string, value: any, providerName: string) {
  if (typeof value === 'undefined')
    // TODO(Bacon): Add learn more
    throw new Error(
      `Client Id property \`${idName}\` must be defined to use ${providerName} auth on this platform.`
    );
}

export function useProxyEnabled(
  redirectUriOptions: Pick<AuthSessionRedirectUriOptions, 'useProxy'>
): boolean {
  return useMemo(() => redirectUriOptions.useProxy ?? shouldUseProxy(), [
    redirectUriOptions.useProxy,
  ]);
}
