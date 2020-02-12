import React, { ComponentType, forwardRef } from 'react';
import { Platform } from 'react-native';
import View, { ViewProps } from '../primitives/View';

const nativeProps: ViewProps = Platform.select({
  web: {
    accessibilityRole: 'article',
  },
  default: {},
});
export const Article = forwardRef((props: ViewProps, ref) => {
  return <View {...props} {...nativeProps} ref={ref} />;
}) as ComponentType<ViewProps>;
