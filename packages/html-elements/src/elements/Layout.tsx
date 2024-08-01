import React, { ComponentType, forwardRef } from 'react';
import { Platform } from 'react-native';

import View, { ViewProps } from '../primitives/View';

function createView(nativeProps: ViewProps = {}): ComponentType<ViewProps> {
  return forwardRef((props: ViewProps, ref) => {
    return <View {...nativeProps} {...props} ref={ref} />;
  }) as ComponentType<ViewProps>;
}

export const Div = createView();

export const Nav = createView(
  Platform.select({
    web: {
      role: 'navigation',
    },
  })
);
export const Footer = createView(
  Platform.select({
    web: {
      role: 'contentinfo',
    },
  })
);
export const Aside = createView(
  Platform.select({
    web: {
      role: 'complementary',
    },
  })
);
export const Header = createView(
  Platform.select({
    web: {
      role: 'banner',
    },
    default: {
      accessibilityRole: 'header',
    },
  })
);
export const Main = createView(
  Platform.select({
    web: {
      role: 'main',
    },
  })
);
export const Article = createView(
  Platform.select({
    web: {
      role: 'article',
    },
  })
);
export const Section = createView({
  role: 'summary', // region?
});
