import type { StackAnimationTypes } from 'react-native-screens';

import type { ModalConfig } from './types';

export function getStackAnimationType(config: ModalConfig): StackAnimationTypes | undefined {
  switch (config.animationType) {
    case 'fade':
      return 'fade';
    case 'none':
      return 'none';
    case 'slide':
    default:
      return 'slide_from_bottom';
  }
}

export function getStackPresentationType(config: ModalConfig) {
  if (process.env.EXPO_OS === 'android') {
    if (config.transparent) {
      return 'transparentModal';
    }
    switch (config.presentationStyle) {
      case 'fullScreen':
        return 'fullScreenModal';
      case 'overFullScreen':
        return 'transparentModal';
      case 'pageSheet':
        return 'pageSheet';
      case 'formSheet':
        return 'formSheet';
      default:
        return 'fullScreenModal';
    }
  }
  switch (config.presentationStyle) {
    case 'overFullScreen':
      return 'transparentModal';
    case 'pageSheet':
      return 'pageSheet';
    case 'formSheet':
      return 'formSheet';
    case 'fullScreen':
    default:
      if (config.transparent) {
        return 'transparentModal';
      }
      return 'fullScreenModal';
  }
}
