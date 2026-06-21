import { CodedError, UnavailabilityError } from 'expo-modules-core';

import ExpoFontLoader from './ExpoFontLoader';
import type { FontSource, ServerFontResourceDescriptor } from './Font.types';
import { getAssetForSource, loadSingleFontAsync } from './FontLoader';

export { withServerContext } from './serverContext';

/**
 * @returns the server resources that should be statically extracted.
 * @private
 */
export function getServerResources(): string[] {
  if (!ExpoFontLoader.getServerResources) {
    throw new UnavailabilityError('expo-font', 'getServerResources');
  }
  return ExpoFontLoader.getServerResources();
}

export function getServerResourceDescriptors(): ServerFontResourceDescriptor[] {
  if (!ExpoFontLoader.getServerResourceDescriptors) {
    throw new UnavailabilityError('expo-font', 'getServerResourceDescriptors');
  }
  return ExpoFontLoader.getServerResourceDescriptors();
}

export function registerStaticFont(fontFamily: string, source?: FontSource | null) {
  // MUST BE A SYNC FUNCTION!
  if (!source) {
    throw new CodedError(
      `ERR_FONT_SOURCE`,
      `Cannot load null or undefined font source: { "${fontFamily}": ${source} }. Expected asset of type \`FontSource\` for fontFamily of name: "${fontFamily}"`
    );
  }
  const asset = getAssetForSource(source);

  loadSingleFontAsync(fontFamily, asset);
}
