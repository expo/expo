import React, { ComponentType, forwardRef } from 'react';
import { Linking, Platform } from 'react-native';

import { LinkProps } from './Text.types';
import Text from '../primitives/Text';

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
  return <Text role="link" {...props} {...nativeProps} ref={ref} />;
}) as ComponentType<LinkProps>;
