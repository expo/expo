import type { JSXElementConstructor, ReactNode } from 'react';
import React from 'react';
import type { ColorValue } from 'react-native';
import type { ExtendedNativeTabOptions, NativeTabsLabelStyle, NativeTabsProps } from './types';
export declare function filterAllowedChildrenElements<Components extends JSXElementConstructor<any>[]>(children: ReactNode | ReactNode[], components: Components): React.ReactElement<React.ComponentProps<Components[number]>, Components[number]>[];
export declare function isChildOfType<T extends JSXElementConstructor<any>>(child: ReactNode, type: T): child is React.ReactElement<React.ComponentProps<T>, T>;
export declare function shouldTabBeVisible(options: ExtendedNativeTabOptions): boolean;
export declare function convertLabelStylePropToObject(labelStyle: NativeTabsProps['labelStyle']): {
    default?: NativeTabsLabelStyle;
    selected?: NativeTabsLabelStyle;
};
export declare function convertIconColorPropToObject(iconColor: NativeTabsProps['iconColor']): {
    default?: ColorValue;
    selected?: ColorValue;
};
//# sourceMappingURL=utils.d.ts.map