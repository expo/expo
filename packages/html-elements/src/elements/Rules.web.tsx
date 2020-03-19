import { ComponentType, forwardRef } from 'react';
import { createElement } from 'react-native';

import { TextProps } from '../primitives/Text';
import { ViewProps } from '../primitives/View';

export const BR = forwardRef((props: TextProps, ref) =>
  createElement('br', { ...props, ref })
) as ComponentType<TextProps>;

export const HR = forwardRef((props: ViewProps, ref) => {
  return createElement('hr', { ...props, ref });
}) as ComponentType<ViewProps>;
