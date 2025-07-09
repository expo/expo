import React, { ComponentType, PropsWithChildren } from 'react';
import { Platform } from 'react-native';

import Text, { TextProps } from '../primitives/Text';
import View, { ViewProps } from '../primitives/View';

function createView(nativeProps: ViewProps = {}): ComponentType<ViewProps> {
  return function Dom(props: ViewProps) {
    return <View {...nativeProps} {...props} />;
  };
}

export const UL = createView(
  Platform.select({
    web: {
      role: 'list',
    },
  })
);

if (__DEV__) {
  UL.displayName = 'UL';
}

function isTextProps(props: any): props is TextProps {
  // Treat <li></li> as a Text element.
  return typeof props.children === 'string';
}

type LIProps = TextProps | ViewProps;

export function LI(props: PropsWithChildren<LIProps>) {
  if (isTextProps(props)) {
    const role: LIProps['role'] = Platform.select({
      web: 'listitem',
      default: props.role,
    });
    return <Text {...props} role={role} />;
  }
  const role: LIProps['role'] = Platform.select({
    web: 'listitem',
    default: props.role,
  });
  return <View {...props} role={role} />;
}
