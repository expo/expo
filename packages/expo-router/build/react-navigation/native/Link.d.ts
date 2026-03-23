import * as React from 'react';
import { type GestureResponderEvent, Text, type TextProps } from 'react-native';
import { type LinkProps } from './useLinkProps';
type Props<ParamList extends ReactNavigation.RootParamList> = LinkProps<ParamList> & Omit<TextProps, 'disabled'> & {
    target?: string;
    onPress?: (e: React.MouseEvent<HTMLAnchorElement, MouseEvent> | GestureResponderEvent) => void;
    disabled?: boolean | null;
    children: React.ReactNode;
};
/**
 * Component to render link to another screen using a path.
 * Uses an anchor tag on the web.
 *
 * @param props.screen Name of the screen to navigate to (e.g. `'Feeds'`).
 * @param props.params Params to pass to the screen to navigate to (e.g. `{ sort: 'hot' }`).
 * @param props.href Optional absolute path to use for the href (e.g. `/feeds/hot`).
 * @param props.action Optional action to use for in-page navigation. By default, the path is parsed to an action based on linking config.
 * @param props.children Child elements to render the content.
 */
export declare function Link<ParamList extends ReactNavigation.RootParamList>({ screen, params, action, href, style, ...rest }: Props<ParamList>): React.CElement<TextProps, Text>;
export {};
//# sourceMappingURL=Link.d.ts.map