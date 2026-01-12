import { capitalize } from '~/common/utilities';
import { PlatformName } from '~/types/common';

const CLIENT_PLATFORM_TAGS = new Set(['expo-go', 'dev-builds']);

export function getPlatformName(text: string): PlatformName {
  const lowerText = text.toLowerCase().trim();
  if (lowerText.includes('ios')) {
    return 'ios';
  }
  if (lowerText.includes('android')) {
    return 'android';
  }
  if (lowerText.includes('web')) {
    return 'web';
  }
  if (lowerText.includes('server')) {
    return 'server';
  }
  if (lowerText.includes('macos')) {
    return 'macos';
  }
  if (lowerText.includes('tvos')) {
    return 'tvos';
  }
  if (lowerText === 'expo-go') {
    return 'expo';
  }
  if (lowerText === 'dev-builds') {
    return 'dev-builds';
  }
  return '';
}

export function getTagClasses(type: string) {
  switch (type) {
    case 'android':
      return 'bg-palette-green3 text-palette-green12 border-palette-green4';
    case 'ios':
      return 'bg-palette-blue3 text-palette-blue12 border-palette-blue4';
    case 'web':
      return 'bg-palette-orange3 text-palette-orange12 border-palette-orange3.5 dark:bg-palette-orange4 dark:border-palette-orange5';
    case 'server':
      return 'bg-palette-gray3 text-palette-gray12 border-palette-gray4 dark:bg-palette-gray4 dark:border-palette-gray4';
    case 'macos':
      return 'bg-palette-purple3 text-palette-purple12 border-palette-purple4';
    case 'tvos':
      return 'bg-palette-pink3 text-palette-pink12 border-palette-pink4';
    case 'expo':
      return 'bg-palette-purple3 text-palette-purple12 border-palette-purple4';
    case 'dev-builds':
      return 'bg-palette-gray3 text-palette-gray12 border-palette-gray4';
    case 'deprecated':
      return 'bg-palette-yellow2 text-palette-yellow12 border-palette-yellow4';
    case 'experimental':
      return 'bg-palette-purple3 text-palette-purple12 border-palette-purple4';
    default:
      return undefined;
  }
}

export const isClientPlatformTag = (platform: string) =>
  CLIENT_PLATFORM_TAGS.has(platform.toLowerCase());

export const formatName = (name: PlatformName) => {
  const cleanName = name.toLowerCase().replace('\n', '').trim();
  if (cleanName.includes('expo-go')) {
    return 'Expo Go';
  } else if (cleanName.includes('dev-builds')) {
    return 'Dev builds';
  } else if (cleanName.includes('ios')) {
    return cleanName.replace('ios', 'iOS');
  } else if (cleanName.includes('macos')) {
    return cleanName.replace('macos', 'macOS');
  } else if (cleanName.includes('tvos')) {
    return cleanName.replace('tvos', 'tvOS');
  } else {
    return capitalize(name);
  }
};
