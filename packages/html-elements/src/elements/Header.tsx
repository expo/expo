import React, { ComponentType, forwardRef } from 'react';
import { Platform } from 'react-native';
import View, { ViewProps } from '../primitives/View';

const nativeProps: ViewProps = Platform.select({
  web: {
    accessibilityRole: 'banner',
  },
  default: {
    accessibilityRole: 'header',
  },
});

export const Header = forwardRef((props: ViewProps, ref) => {
  return <View {...nativeProps} {...props} ref={ref} />;
}) as ComponentType<ViewProps>;
