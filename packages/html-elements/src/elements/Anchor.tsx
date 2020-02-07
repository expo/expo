import React from 'react';
import { Linking, Platform } from 'react-native';

import Text, { TextProps } from '../primitives/Text';

export const A: React.ComponentType<TextProps> = React.forwardRef(
  ({ href, ...props }: TextProps, ref: React.ClassAttributes<Text>['ref']) => {
    const nativeProps = Platform.select({
      web: {
        href,
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
);
