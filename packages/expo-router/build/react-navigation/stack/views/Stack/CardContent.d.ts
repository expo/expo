import * as React from 'react';
import { type ViewProps } from 'react-native';
type Props = ViewProps & {
    enabled: boolean;
    layout: {
        width: number;
        height: number;
    };
    children: React.ReactNode;
};
export declare function CardContent({ enabled, layout, style, ...rest }: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=CardContent.d.ts.map