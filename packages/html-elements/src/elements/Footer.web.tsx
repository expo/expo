import { ComponentType, forwardRef } from 'react';
import { createElement } from 'react-native';
import { ViewProps } from '../primitives/View';

export const Footer = forwardRef((props: ViewProps, ref) => {
  return createElement('footer', { ...props, ref });
}) as ComponentType<ViewProps>;
