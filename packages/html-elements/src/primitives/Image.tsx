import { ClassAttributes, ComponentProps, ComponentType } from 'react';
import { Image as NativeImage, ImageStyle as NativeImageStyle, StyleProp } from 'react-native';

import { WebViewStyle } from './View';
import { createSafeStyledView } from '../css/createSafeStyledView';

type NativeImageProps = ComponentProps<typeof NativeImage> & ClassAttributes<typeof NativeImage>;

export interface WebImageStyle {
  opacity?: number;
}

export type ImageStyle = Omit<NativeImageStyle, 'position'> & WebImageStyle & WebViewStyle;

export type WebImageProps = {
  style?: StyleProp<ImageStyle>;
  /** @platform web */
  tabIndex?: number;
  /**
   * Set whether the image can be dragged with native browser behavior.
   * @platform web
   */
  draggable?: boolean;
};

export type ImageProps = Omit<NativeImageProps, 'style'> & WebImageProps;

const Image = NativeImage as ComponentType<ImageProps>;

export default createSafeStyledView(Image) as ComponentType<ImageProps>;
