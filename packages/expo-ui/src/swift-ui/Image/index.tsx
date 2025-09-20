import { requireNativeView } from 'expo';
import { type SFSymbol } from 'sf-symbols-typescript';

import { type ViewEvent } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export interface ImageProps extends CommonViewModifierProps {
  /**
   * The name of the system image (SF Symbol).
   * For example: 'photo', 'heart.fill', 'star.circle'
   */
  systemName: SFSymbol;
  /**
   * The size of the system image.
   */
  size?: number;
  /**
   * The color of the system image.
   * Can be a color name like '#ff00ff', 'red', 'blue', etc.
   */
  color?: string;
  /**
   * The variable value for SF Symbols with variable color support.
   * Can be a number between 0.0 and 1.0.
   * Only works with SF Symbols that support variable color.
   *
   * Requires iOS 16.0+.
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
