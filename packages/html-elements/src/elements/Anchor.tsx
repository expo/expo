import React, { ComponentType, forwardRef } from 'react';
import { Linking, Platform } from 'react-native';

import Text, { TextProps } from '../primitives/Text';

export const A = forwardRef(({ href, target, ...props }: TextProps, ref) => {
  const nativeProps = Platform.select<TextProps>({
    web: {
      href,
      target,
    },
    default: {
      onPress: event => {
        props.onPress && props.onPress(event);
        if (Platform.OS !== 'web' && href !== undefined) {
          Linking.openURL(href);
        }
      },
    },
  });
  return <Text accessibilityRole="link" {...props} {...nativeProps} ref={ref} />;
}) as ComponentType<TextProps>;
