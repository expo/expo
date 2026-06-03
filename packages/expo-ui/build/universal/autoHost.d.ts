import type { ReactNode } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import type { UniversalHostProps } from './Host/types';
export type AutoHostOptions = Pick<UniversalHostProps, 'matchContents' | 'style' | 'useViewportSizeMeasurement'>;
export type EnsureHostProps = AutoHostOptions & {
    children?: ReactNode;
};
export declare const intrinsicHostOptions: AutoHostOptions;
export declare function copyHostSizingStyle(style?: StyleProp<ViewStyle>): StyleProp<ViewStyle> | undefined;
export declare function layoutHostOptions(style?: StyleProp<ViewStyle>): AutoHostOptions;
export declare function fullHostOptions(style?: StyleProp<ViewStyle>): AutoHostOptions;
export declare function verticalContentHostOptions(style?: StyleProp<ViewStyle>): AutoHostOptions;
export declare function EnsureHost({ children, ...hostProps }: EnsureHostProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=autoHost.d.ts.map