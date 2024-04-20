import { capitalize } from '~/components/plugins/api/APISectionUtils';
import { PlatformName } from '~/types/common';

export const getPlatformName = (text: string): PlatformName => {
  if (text.toLowerCase().includes('ios')) return 'ios';
  if (text.toLowerCase().includes('android')) return 'android';
  if (text.toLowerCase().includes('web')) return 'web';
  if (text.toLowerCase().includes('macos')) return 'macos';
  if (text.toLowerCase().includes('tvos')) return 'tvos';
  return '';
};

export const TAG_CLASSES = {
  android: '!bg-palette-green4 !text-palette-green12 !border-palette-green5',
  ios: '!bg-palette-blue4 !text-palette-blue12 !border-palette-blue5',
  web: '!bg-palette-orange4 !text-palette-orange12 !border-palette-orange5',
  macos: '!bg-palette-purple4 !text-palette-purple12 !border-palette-purple5',
  tvos: '!bg-palette-pink4 !text-palette-pink12 !border-palette-pink5',
  deprecated: '!bg-palette-yellow3 !text-palette-yellow12 !border-palette-yellow5',
  experimental: '!bg-palette-pink4 !text-palette-pink12 !border-palette-pink5',
};

export const formatName = (name: PlatformName) => {
  const cleanName = name.toLowerCase().replace('\n', '');
  if (cleanName.includes('ios')) {
    return cleanName.replace('ios', 'iOS');
  } else if (cleanName.includes('macos')) {
    return cleanName.replace('macos', 'macOS');
  } else if (cleanName.includes('tvos')) {
    return cleanName.replace('tvos', 'tvOS');
  } else {
    return capitalize(name);
  }
};
