import * as React from 'react';
import { ViewProps } from 'react-native';
type ContainerProps = ViewProps & {
    labelTop?: string;
    labelBottom?: string;
    children?: React.ReactNode;
};
export declare function Container({ children, labelTop, style, ...rest }: ContainerProps): JSX.Element;
export {};
//# sourceMappingURL=Container.d.ts.map