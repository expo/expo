import {
  ImageContentFit,
  ImageContentPosition,
  ImageContentPositionObject,
  ImageContentPositionString,
  ImageProps,
  ImageTransition,
} from './Image.types';

let loggedResizeModeDeprecationWarning = false;
let loggedRepeatDeprecationWarning = false;
let loggedFadeDurationDeprecationWarning = false;

/**
 * If the `contentFit` is not provided, it's resolved from the equivalent `resizeMode` prop
 * that we support to provide compatibility with React Native Image.
 */
export function resolveContentFit(
  contentFit?: ImageContentFit,
  resizeMode?: ImageProps['resizeMode']
): ImageContentFit {
  if (contentFit) {
    return contentFit;
  }
  if (resizeMode) {
    if (!loggedResizeModeDeprecationWarning) {
      console.log('[expo-image]: Prop "resizeMode" is deprecated, use "contentFit" instead');
      loggedResizeModeDeprecationWarning = true;
    }

    switch (resizeMode) {
      case 'contain':
      case 'cover':
        return resizeMode;
      case 'stretch':
        return 'fill';
      case 'center':
        return 'scale-down';
      case 'repeat':
        if (!loggedRepeatDeprecationWarning) {
          console.log('[expo-image]: Resize mode "repeat" is no longer supported');
          loggedRepeatDeprecationWarning = true;
        }
    }
  }
  return 'cover';
}

/**
 * It resolves a stringified form of the `contentPosition` prop to an object,
 * which is the only form supported in the native code.
 */
export function resolveContentPosition(
  contentPosition?: ImageContentPosition
): ImageContentPositionObject {
  if (typeof contentPosition === 'string') {
    const contentPositionStringMappings: Record<
      ImageContentPositionString,
      ImageContentPositionObject
    > = {
      center: { top: '50%', left: '50%' },
      top: { top: 0, left: '50%' },
      right: { top: '50%', right: 0 },
      bottom: { bottom: 0, left: '50%' },
      left: { top: '50%', left: 0 },
      'top center': { top: 0, left: '50%' },
      'top right': { top: 0, right: 0 },
      'top left': { top: 0, left: 0 },
      'right center': { top: '50%', right: 0 },
      'right top': { top: 0, right: 0 },
      'right bottom': { bottom: 0, right: 0 },
      'bottom center': { bottom: 0, left: '50%' },
      'bottom right': { bottom: 0, right: 0 },
      'bottom left': { bottom: 0, left: 0 },
      'left center': { top: '50%', left: 0 },
      'left top': { top: 0, left: 0 },
      'left bottom': { bottom: 0, left: 0 },
    };
    const contentPositionObject = contentPositionStringMappings[contentPosition];

    if (!contentPositionObject) {
      console.warn(`[expo-image]: Content position "${contentPosition}" is invalid`);
      return contentPositionStringMappings.center;
    }
    return contentPositionObject;
  }
  return contentPosition ?? { top: '50%', left: '50%' };
}

/**
 * If `transition` or `fadeDuration` is a number, it's resolved to a cross dissolve transition with the given duration.
 * When `fadeDuration` is used, it logs an appropriate deprecation warning.
 */
export function resolveTransition(
  transition?: ImageProps['transition'],
  fadeDuration?: ImageProps['fadeDuration']
): ImageTransition | null {
  if (typeof transition === 'number') {
    return { duration: transition };
  }
  if (!transition && typeof fadeDuration === 'number') {
    if (!loggedFadeDurationDeprecationWarning) {
      console.warn('[expo-image]: Prop "fadeDuration" is deprecated, use "transition" instead');
      loggedFadeDurationDeprecationWarning = true;
    }
    return { duration: fadeDuration };
  }
  return transition ?? null;
}
