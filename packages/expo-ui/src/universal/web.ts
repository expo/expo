import type { ComponentProps, ElementType } from 'react';
import {
  unstable_createElement,
  type ImageStyle,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

type Simplify<T> = { [K in keyof T]: T[K] };
type Merge<A, B> = Simplify<Omit<A, keyof B> & B>;
type Style = StyleProp<ImageStyle | TextStyle | ViewStyle>;

export const createWebComponent =
  <T extends ElementType>(type: T) =>
  (props: Merge<ComponentProps<T>, { style?: Style }>) =>
    unstable_createElement(type, props);
