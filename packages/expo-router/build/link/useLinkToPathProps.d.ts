import { MouseEvent } from 'react';
import { GestureResponderEvent } from 'react-native';
import { LinkToOptions } from '../global-state/routing';
type UseLinkToPathPropsOptions = LinkToOptions & {
    href: string;
    setShowPreview?: (showPreview: boolean) => void;
};
export default function useLinkToPathProps({ href, setShowPreview, ...options }: UseLinkToPathPropsOptions): {
    href: string;
    role: "link";
    onPress: (event?: MouseEvent<HTMLAnchorElement> | GestureResponderEvent) => void;
    onLongPress: () => void;
};
export declare function shouldHandleMouseEvent(event?: MouseEvent<HTMLAnchorElement> | GestureResponderEvent): boolean;
export {};
//# sourceMappingURL=useLinkToPathProps.d.ts.map