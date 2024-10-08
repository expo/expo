import * as React from 'react';
import { GestureResponderEvent } from 'react-native';
import { LinkToOptions } from '../global-state/routing';
type UseLinkToPathPropsOptions = LinkToOptions & {
    href: string;
};
export default function useLinkToPathProps({ href, ...options }: UseLinkToPathPropsOptions): {
    href: string;
    role: "link";
    onPress: (event?: React.MouseEvent<HTMLAnchorElement, MouseEvent> | GestureResponderEvent) => void;
};
export declare function shouldHandleMouseEvent(event?: React.MouseEvent<HTMLAnchorElement, MouseEvent> | GestureResponderEvent): boolean;
export {};
//# sourceMappingURL=useLinkToPathProps.d.ts.map