import React, { ComponentType, forwardRef, PropsWithChildren } from 'react';
import { Platform } from 'react-native';

import Text, { TextProps } from '../primitives/Text';
import View, { ViewProps } from '../primitives/View';

function createView(nativeProps: ViewProps = {}): ComponentType<ViewProps> {
  return forwardRef((props: ViewProps, ref) => {
    return <View {...nativeProps} {...props} ref={ref} />;
  }) as ComponentType<ViewProps>;
}

export const UL = createView(
  Platform.select({
    web: {
      role: 'list',
    },
  })
);

function isTextProps(props: any): props is TextProps {
  // Treat <li></li> as a Text element.
  return typeof props.children === 'string';
}

type LIProps = TextProps | ViewProps;

export const LI = forwardRef((props: PropsWithChildren<LIProps>, ref: any) => {
  if (isTextProps(props)) {
    const role: LIProps['role'] = Platform.select({
      web: 'listitem',
      default: props.role,
    });
    return <Text {...props} role={role} ref={ref} />;
  }
  const role: LIProps['role'] = Platform.select({
    web: 'listitem',
    default: props.role,
  });
  return <View {...props} role={role} ref={ref} />;
}) as ComponentType<LIProps>;
