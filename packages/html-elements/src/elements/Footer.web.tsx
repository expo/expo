import { ComponentType, createElement, forwardRef } from 'react';

import { ViewProps } from '../primitives/View';

export const Footer = forwardRef((props: ViewProps, ref) => {
  return createElement('footer', { ...props, ref });
}) as ComponentType<ViewProps>;
