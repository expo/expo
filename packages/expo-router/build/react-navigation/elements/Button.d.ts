import * as React from 'react';
import { type LinkProps } from '../native';
import { type Props as PlatformPressableProps } from './PlatformPressable';
type ButtonBaseProps = Omit<PlatformPressableProps, 'children'> & {
    variant?: 'plain' | 'tinted' | 'filled';
    color?: string;
    children: string | string[];
};
type ButtonLinkProps<ParamList extends ReactNavigation.RootParamList> = LinkProps<ParamList> & Omit<ButtonBaseProps, 'onPress'>;
export declare function Button<ParamList extends ReactNavigation.RootParamList>(props: ButtonLinkProps<ParamList>): React.JSX.Element;
export declare function Button(props: ButtonBaseProps): React.JSX.Element;
export {};
//# sourceMappingURL=Button.d.ts.map