import { ClassAttributes, ComponentProps, ComponentType } from 'react';
import {
  StyleProp,
  View as NativeView,
  ViewStyle as NativeViewStyle,
  BoxShadowValue,
  FilterFunction,
} from 'react-native';

import { createDevView } from './createDevView';
import { createSafeStyledView } from '../css/createSafeStyledView';

// https://github.com/necolas/react-native-web/issues/832

type NativeViewProps = ComponentProps<typeof NativeView> & ClassAttributes<typeof NativeView>;

/**
 * https://baconbrix.gitbook.io/react-native-web/primitives/view
 */
export interface WebViewStyle {
  /** @platform web */
  backdropFilter?: string;
  /** @platform web */
  animationDelay?: string;
  /** @platform web */
  animationDirection?: string;
  /** @platform web */
  animationDuration?: string;
  /** @platform web */
  animationFillMode?: string;
  /** @platform web */
  animationName?: string | any[];
  /** @platform web */
  animationIterationCount?: number | 'infinite';
  /** @platform web */
  animationPlayState?: string;
  /** @platform web */
  animationTimingFunction?: string;
  /** @platform web */
  backgroundAttachment?: string;
  /** @platform web */
  backgroundBlendMode?: string;
  /** @platform web */
  backgroundClip?: string;
  /** @platform web */
  backgroundImage?: string;
  /** @platform web */
  backgroundOrigin?: 'border-box' | 'content-box' | 'padding-box';
  /** @platform web */
  backgroundPosition?: string;
  /** @platform web */
  backgroundRepeat?: string;
  /** @platform web */
  backgroundSize?: string;
  /** @platform web */
  boxShadow?: string | readonly BoxShadowValue[];
  /** @platform web */
  boxSizing?: string;
  /** @platform web */
  clip?: string;
  /** @platform web */
  cursor?: string;
  /** @platform web */
  filter?: string | readonly FilterFunction[];
  /** @platform web */
  gridAutoColumns?: string;
  /** @platform web */
  gridAutoFlow?: string;
  /** @platform web */
  gridAutoRows?: string;
  /** @platform web */
  gridColumnEnd?: string;
  /** @platform web */
  gridColumnGap?: string;
  /** @platform web */
  gridColumnStart?: string;
  /** @platform web */
  gridRowEnd?: string;
  /** @platform web */
  gridRowGap?: string;
  /** @platform web */
  gridRowStart?: string;
  /** @platform web */
  gridTemplateColumns?: string;
  /** @platform web */
  gridTemplateRows?: string;
  /** @platform web */
  gridTemplateAreas?: string;
  /** @platform web */
  outline?: string;
  /** @platform web */
  outlineColor?: string;
  /** @platform web */
  overflowX?: string;
  /** @platform web */
  overflowY?: string;
  /** @platform web */
  overscrollBehavior?: 'auto' | 'contain' | 'none';
  /** @platform web */
  overscrollBehaviorX?: 'auto' | 'contain' | 'none';
  /** @platform web */
  overscrollBehaviorY?: 'auto' | 'contain' | 'none';
  /** @platform web */
  perspective?: string;
  /** @platform web */
  perspectiveOrigin?: string;
  /** @platform web */
  touchAction?: string;
  /** @platform web */
  transformOrigin?: string | (string | number)[];
  /** @platform web */
  transitionDelay?: string;
  /** @platform web */
  transitionDuration?: string;
  /** @platform web */
  transitionProperty?: string;
  /** @platform web */
  transitionTimingFunction?: string;
  /** @platform web */
  userSelect?: string;
  /** @platform web */
  visibility?: string;
  /** @platform web */
  willChange?: string;
  /** @platform web */
  position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';
}

export type ViewStyle = Omit<NativeViewStyle, 'position'> & WebViewStyle;

export type WebViewProps = {
  style?: StyleProp<ViewStyle>;
};

export type ViewProps = WebViewProps & Omit<NativeViewProps, 'style'>;

let View = NativeView as ComponentType<ViewProps>;

if (process.env.NODE_ENV !== 'production') {
  // Add better errors and warnings in development builds.
  View = createDevView(NativeView) as ComponentType<ViewProps>;
}

export default createSafeStyledView(View) as ComponentType<ViewProps>;
