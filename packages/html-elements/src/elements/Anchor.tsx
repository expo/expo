import React, { ClassAttributes, ComponentType, forwardRef } from 'react';
import { Linking, Platform } from 'react-native';

import Text, { TextProps } from '../primitives/Text';

export const A = forwardRef(
  ({ href, target, ...props }: TextProps, ref?: ClassAttributes<typeof Text>['ref']) => {
    const nativeProps = Platform.select({
      web: {
        href,
        target,
      },
      default: {
        // @ts-ignore
        onPress: event => {
          props.onPress && props.onPress(event);
          if (Platform.OS !== 'web' && href !== undefined) {
            Linking.openURL(href);
          }
        },
      },
    });
    return <Text accessibilityRole="link" {...props} {...nativeProps} ref={ref} />;
  }
) as ComponentType<TextProps>;
