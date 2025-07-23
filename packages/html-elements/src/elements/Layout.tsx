import React, { ComponentType } from 'react';
import { Platform } from 'react-native';

import View, { ViewProps } from '../primitives/View';

function createView(nativeProps: ViewProps = {}): ComponentType<ViewProps> {
  return function Dom(props: ViewProps) {
    return <View {...nativeProps} {...props} />;
  };
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

if (__DEV__) {
  Div.displayName = 'Div';
  Nav.displayName = 'Nav';
  Footer.displayName = 'Footer';
  Aside.displayName = 'Aside';
  Header.displayName = 'Header';
  Main.displayName = 'Main';
  Article.displayName = 'Article';
  Section.displayName = 'Section';
}
