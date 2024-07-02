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
      return '!bg-palette-green4 !text-palette-green12 !border-palette-green5';
    case 'ios':
      return '!bg-palette-blue4 !text-palette-blue12 !border-palette-blue5';
    case 'web':
      return '!bg-palette-orange4 !text-palette-orange12 !border-palette-orange5';
    case 'macos':
      return '!bg-palette-purple4 !text-palette-purple12 !border-palette-purple5';
    case 'tvos':
      return '!bg-palette-pink4 !text-palette-pink12 !border-palette-pink5';
    case 'deprecated':
      return '!bg-palette-yellow3 !text-palette-yellow12 !border-palette-yellow5';
    case 'experimental':
      return '!bg-palette-pink4 !text-palette-pink12 !border-palette-pink5';
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
