import { UnavailabilityError } from 'expo-modules-core';

import { ParsedURL, SendIntentExtras, URLListener } from './Linking.types';

export function addEventListener(type: 'url', handler: URLListener) {
  return { remove() {} };
}

export async function parseInitialURLAsync(): Promise<ParsedURL> {
  return {
    scheme: null,
    hostname: null,
    path: null,
    queryParams: null,
  };
}

export async function sendIntent(action: string, extras?: SendIntentExtras[]): Promise<void> {
  throw new UnavailabilityError('Linking', 'sendIntent');
}

export async function openSettings(): Promise<void> {
  throw new UnavailabilityError('Linking', 'openSettings');
}

export async function getInitialURL(): Promise<string | null> {
  return '';
}

export function getLinkingURL() {
  return '';
}

export async function openURL(url: string): Promise<true> {
  return true;
}

export async function canOpenURL() {
  return true;
}

export function useURL(): string | null {
  return null;
}

export function useLinkingURL() {
  return null;
}

export * from './Linking.types';

export function collectManifestSchemes() {
  return [];
}

export function hasConstantsManifest() {
  return false;
}

export function hasCustomScheme() {
  return false;
}

export function resolveScheme() {
  return '';
}

export { parse, createURL } from './createURL';
