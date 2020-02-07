import { ComponentType, forwardRef } from 'react';
import { createElement } from 'react-native';
import { ViewProps } from '../primitives/View';

export const Nav = forwardRef((props: ViewProps, ref) => {
  return createElement('nav', { ...props, ref });
}) as ComponentType<ViewProps>;
