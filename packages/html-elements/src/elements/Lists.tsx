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
      accessibilityRole: 'list',
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
    const accessibilityRole: LIProps['accessibilityRole'] = Platform.select({
      web: 'listitem',
      default: props.accessibilityRole,
    });
    return <Text {...props} accessibilityRole={accessibilityRole} ref={ref} />;
  }
  const accessibilityRole: LIProps['accessibilityRole'] = Platform.select({
    web: 'listitem',
    default: props.accessibilityRole,
  });
  return <View {...props} accessibilityRole={accessibilityRole} ref={ref} />;
}) as ComponentType<LIProps>;
