import { capitalize } from '~/components/plugins/api/APISectionUtils';
import { PlatformName } from '~/types/common';

export function getPlatformName(text: string): PlatformName {
  if (text.toLowerCase().includes('ios')) return 'ios';
  if (text.toLowerCase().includes('android')) return 'android';
  if (text.toLowerCase().includes('web')) return 'web';
  if (text.toLowerCase().includes('macos')) return 'macos';
  if (text.toLowerCase().includes('tvos')) return 'tvos';
  return '';
}

export function getTagClasses(type: string) {
  switch (type) {
    case 'android':
      return '!bg-palette-green3 !text-palette-green12 !border-palette-green4';
    case 'ios':
      return '!bg-palette-blue3 !text-palette-blue12 !border-palette-blue4';
    case 'web':
      return '!bg-palette-orange3 !text-palette-orange12 !border-palette-orange4';
    case 'macos':
      return '!bg-palette-purple3 !text-palette-purple12 !border-palette-purple4';
    case 'tvos':
      return '!bg-palette-pink3 !text-palette-pink12 !border-palette-pink4';
    case 'deprecated':
      return '!bg-palette-yellow2 !text-palette-yellow12 !border-palette-yellow4';
    case 'experimental':
      return '!bg-palette-pink3 !text-palette-pink12 !border-palette-pink4';
    default:
      return undefined;
  }
}

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
