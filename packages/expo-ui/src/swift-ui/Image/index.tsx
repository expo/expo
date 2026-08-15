import { requireNativeView } from 'expo';
import type { ColorValue } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';

import type { ViewEvent } from '../../types';
import { font, foregroundStyle } from '../modifiers';
import { createViewModifierEventListener } from '../modifiers/utils';
import type { CommonViewModifierProps } from '../types';

export interface ImageProps extends CommonViewModifierProps {
  /**
   * The name of the system image (SF Symbol).
   * For example: 'photo', 'heart.fill', 'star.circle'
   */
  systemName?: SFSymbol;
  /**
   * The asset catalog name of a custom SF Symbol imported as a symbol set.
   */
  assetName?: string;
  /**
   * The URI of the local image file to display.
   * For example: 'file:///path/to/image.jpg'
   * Performs a synchronous read operation that blocks the main thread.
   */
  uiImage?: string;
  /**
   * The fixed size of the system image in points. Does not scale with Dynamic
   * Type. Use the `font` modifier with `textStyle` for that. Ignored when a
   * `font` modifier is supplied.
   */
  size?: number;
  /**
   * The color of the system image.
   * Can be a color name like '#ff00ff', 'red', 'blue', etc.
   */
  color?: ColorValue;
  /**
   * The variable value that alters the symbol's appearance.
   * A number between 0.0 and 1.0.
   * Only works with SF Symbols that support variable values (SF Symbols 4.0+).
   * @platform ios16.0+
   * @platform tvos16.0+
   */
  variableValue?: number;

  /**
   * Callback triggered when the view is pressed.
   */
  onPress?: () => void;
}

type TapEvent = ViewEvent<'onTap', object> & {
  useTapGesture?: boolean;
};

type NativeImageProps = Omit<ImageProps, 'onPress'> | TapEvent;

function transformNativeProps(props: ImageProps): NativeImageProps {
  const { onPress, modifiers, size, color, ...restProps } = props;
  const hasFontModifier = modifiers?.some((modifier) => modifier.$type === 'font');
  const allModifiers = [
    ...(modifiers ?? []),
    ...(hasFontModifier ? [] : [font({ size: size ?? 24 })]),
    ...(color != null ? [foregroundStyle(color)] : []),
  ];
  return {
    modifiers: allModifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
    ...(onPress ? { useTapGesture: true, onTap: () => onPress() } : null),
  };
}

const ImageNativeView: React.ComponentType<NativeImageProps> = requireNativeView(
  'ExpoUI',
  'ImageView'
);

export function Image(props: ImageProps) {
  return <ImageNativeView {...transformNativeProps(props)} />;
}
