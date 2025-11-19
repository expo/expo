import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { type ReactNode } from 'react';
export interface StackHeaderLeftProps {
    children?: ReactNode;
    asChild?: boolean;
}
export interface StackHeaderRightProps {
    children?: ReactNode;
    asChild?: boolean;
}
export declare function StackHeaderLeft(props: StackHeaderLeftProps): null;
export declare function StackHeaderRight(props: StackHeaderRightProps): null;
export declare function appendStackHeaderRightPropsToOptions(options: NativeStackNavigationOptions, props: StackHeaderRightProps): NativeStackNavigationOptions;
export declare function appendStackHeaderLeftPropsToOptions(options: NativeStackNavigationOptions, props: StackHeaderLeftProps): NativeStackNavigationOptions;
//# sourceMappingURL=StackHeaderLeftRight.d.ts.map