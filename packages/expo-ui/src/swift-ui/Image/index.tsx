import { requireNativeView } from 'expo';
import { ColorValue } from 'react-native';
import { type SFSymbol } from 'sf-symbols-typescript';

import { type ViewEvent } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export interface ImageProps extends CommonViewModifierProps {
  /**
   * The name of the system image (SF Symbol).
   * For example: 'photo', 'heart.fill', 'star.circle'
   */
  systemName?: SFSymbol;
  /**
   * The URI of the local image file to display.
   * For example: 'file:///path/to/image.jpg'
   * Performs a synchronous read operation that blocks the main thread.
   */
  uiImage?: string;
  /**
   * The name of an image in the app's asset catalog.
   * Use this for images bundled with the app, especially in widgets and live activities
   * where network requests and file I/O are not available.
   * For example: 'AppIcon', 'logo', 'banner'
   */
  assetName?: string;
  /**
   * A base64-encoded image string to display.
   * Use this for images passed through live activity content state or widget timeline entries
   * where you need to transfer image data without file system access.
   */
  base64?: string;
  /**
   * The size of the system image.
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
  const { onPress, modifiers, ...restProps } = props;
  return {
    modifiers,
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
