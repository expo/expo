import React, { ForwardRefExoticComponent, RefAttributes } from 'react';
import { ViewProps } from 'react-native';
import { CssToReactNativeRuntimeOptions } from '../css-to-rn';
export declare function registerCSS(css: string, options?: CssToReactNativeRuntimeOptions): void;
type MockComponentProps = ViewProps & {
    className?: string;
};
export declare function createMockComponent(Component?: React.ComponentType<any>): ForwardRefExoticComponent<MockComponentProps & RefAttributes<MockComponentProps>>;
export {};
//# sourceMappingURL=utils.d.ts.map