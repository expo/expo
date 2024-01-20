import { SupportedPlatform } from '../types';

export function getLinkingImplementationForPlatform(platform: SupportedPlatform) {
  switch (platform) {
    case 'ios':
    case 'macos':
    case 'tvos':
    case 'apple':
      return require('../platforms/apple');
    case 'android':
      return require('../platforms/android');
    case 'devtools':
      return require('../platforms/devtools');
  }
}
