import React, { forwardRef } from 'react';
import { Platform } from 'react-native';
import View from '../primitives/View';
function createView(nativeProps = {}) {
    return forwardRef((props, ref) => {
        return React.createElement(View, { ...nativeProps, ...props, ref: ref });
    });
}
export const Div = createView();
export const Nav = createView(Platform.select({
    web: {
        accessibilityRole: 'navigation',
    },
}));
export const Footer = createView(Platform.select({
    web: {
        accessibilityRole: 'contentinfo',
    },
}));
export const Aside = createView(Platform.select({
    web: {
        accessibilityRole: 'complementary',
    },
}));
export const Header = createView(Platform.select({
    web: {
        accessibilityRole: 'banner',
    },
    default: {
        accessibilityRole: 'header',
    },
}));
export const Main = createView(Platform.select({
    web: {
        accessibilityRole: 'main',
    },
}));
export const Article = createView(Platform.select({
    web: {
        accessibilityRole: 'article',
    },
}));
export const Section = createView({
    accessibilityRole: 'summary', // region?
});
//# sourceMappingURL=Layout.js.map