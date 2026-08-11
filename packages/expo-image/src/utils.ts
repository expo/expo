import { SharedRef } from 'expo';
import type { SharedRefType } from 'expo';
import type { ImageResizeMode, ImageStyle } from 'react-native';

import type {
  ImageContentFit,
  ImageContentPosition,
  ImageContentPositionObject,
  ImageContentPositionString,
  ImageNativeProps,
  ImageProps,
  ImageTransition,
} from './Image.types';

/**
 * Style properties that already determine the layout size of the view.
 */
const SIZING_STYLE_PROPS = [
  'width',
  'height',
  'minWidth',
  'minHeight',
  'aspectRatio',
  'flex',
  'flexGrow',
  'flexBasis',
] as const;

/**
 * Whether the style already determines the layout size of the view, either directly
 * (`SIZING_STYLE_PROPS`, `position: 'absolute'`) or by giving a 0-content box a non-zero size
 * of its own (any `padding*`/`borderWidth*` property, including their logical aliases like
 * `paddingInline` or `borderStartWidth`).
 */
function isSizeDeterminedByStyle(style: ImageStyle): boolean {
  if (style.position === 'absolute' || SIZING_STYLE_PROPS.some((prop) => style[prop] != null)) {
    return true;
  }
  return Object.keys(style).some(
    (prop) => prop.startsWith('padding') || (prop.startsWith('border') && prop.endsWith('Width'))
  );
}

/**
 * Returns the size declared by the image source, to be used as the default size of the view,
 * the same way React Native's `<Image>` does. An asset loaded with `require` carries the size
 * that the bundler read from the file and an `ImageSource` object can declare it explicitly.
 * It is applied only when nothing in the style already determines the layout size, so it can
 * affect only the images that would otherwise be laid out as 0x0.
 */
export function resolveDefaultSize(
  source: ImageNativeProps['source'],
  style: ImageStyle
): { width: number; height: number } | null {
  // Sources in an array may have different sizes, so there is no single default size to use.
  if (!Array.isArray(source) || source.length !== 1) {
    return null;
  }
  const { width, height } = source[0];

  if (typeof width !== 'number' || typeof height !== 'number') {
    return null;
  }
  if (isSizeDeterminedByStyle(style)) {
    return null;
  }
  return { width, height };
}

let loggedResizeModeDeprecationWarning = false;
let loggedRepeatDeprecationWarning = false;
let loggedFadeDurationDeprecationWarning = false;

/**
 * If the `contentFit` is not provided, it's resolved from the equivalent `resizeMode` prop
 * that we support to provide compatibility with React Native Image.
 * For SF Symbols, the default is `'contain'` instead of `'cover'`.
 */
export function resolveContentFit(
  contentFit?: ImageContentFit,
  resizeMode?: ImageResizeMode,
  isSFSymbol?: boolean
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
      case 'none':
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
        return 'cover';
      default: {
        const exhaustiveCheck: never = resizeMode;
        throw new Error(`Unhandled resizeMode case: ${exhaustiveCheck}`);
      }
    }
  }
  // SF Symbols default to 'contain' to preserve aspect ratio
  return isSFSymbol ? 'contain' : 'cover';
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

/**
 * Checks whether the given value is an instance of the `SharedRef<'image'>` class.
 */
export function isImageRef(value: any): value is SharedRefType<'image'> {
  return value instanceof SharedRef && value.nativeRefType === 'image';
}
