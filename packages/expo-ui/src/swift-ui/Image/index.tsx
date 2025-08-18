import { requireNativeView } from 'expo';

import { type ViewEvent } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export interface ImageProps extends CommonViewModifierProps {
  /**
   * The name of the system image (SF Symbol).
   * For example: 'photo', 'heart.fill', 'star.circle'
   */
  systemName: string;
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
