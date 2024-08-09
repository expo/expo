import * as React from 'react';
import { GestureResponderEvent } from 'react-native';
import { LinkToOptions } from '../global-state/routing';
type UseLinkToPathPropsOptions = LinkToOptions & {
    href: string;
};
export default function useLinkToPathProps({ href, ...options }: UseLinkToPathPropsOptions): {
    href: string;
    role: "link";
    onPress: (e?: React.MouseEvent<HTMLAnchorElement, MouseEvent> | GestureResponderEvent) => void;
};
export {};
//# sourceMappingURL=useLinkToPathProps.d.ts.map