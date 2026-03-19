import type { NativeStackHeaderItemCustom } from '@react-navigation/native-stack';
import type { ReactNode } from 'react';
export interface StackToolbarViewProps {
    /**
     * Can be any React node.
     */
    children?: NativeStackHeaderItemCustom['element'];
    /**
     * Whether the view should be hidden.
     *
     * @default false
     */
    hidden?: boolean;
    /**
     * Whether to hide the shared background.
     *
     * @see [Official Apple documentation](https://developer.apple.com/documentation/uikit/uibarbuttonitem/hidessharedbackground) for more information.
     *
     * @platform iOS 26+
     */
    hidesSharedBackground?: boolean;
    /**
     * Whether to separate the background of this item from other items.
     *
     * Only available in bottom placement.
     *
     * @default false
     */
    separateBackground?: boolean;
}
export interface NativeToolbarViewProps {
    children?: ReactNode;
    hidden?: boolean;
    hidesSharedBackground?: boolean;
    separateBackground?: boolean;
}
//# sourceMappingURL=types.d.ts.map