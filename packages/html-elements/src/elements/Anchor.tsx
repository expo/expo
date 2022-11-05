import React, { ComponentType, forwardRef } from 'react';
import { Linking, Platform } from 'react-native';

import Text from '../primitives/Text';
import { LinkProps } from './Text.types';

export const A = forwardRef(({ href, target, download, rel, ...props }: LinkProps, ref) => {
  const nativeProps = Platform.select<LinkProps>({
    web: {
      href,
      hrefAttrs: {
        target,
        download,
        rel,
      },
    },
    default: {
      onPress: (event) => {
        props.onPress && props.onPress(event);
        if (Platform.OS !== 'web' && href !== undefined) {
          Linking.openURL(href);
        }
      },
    },
  });
  return <Text accessibilityRole="link" {...props} {...nativeProps} ref={ref} />;
}) as ComponentType<LinkProps>;
