import type { ReactElement } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { ModifierConfig } from '../../types';
import type { PrimitiveBaseProps } from '../layout';
export interface RNHostProps extends PrimitiveBaseProps {
    /**
     * When `true`, the RNHost will update its size in the Jetpack Compose view tree to match the children's size.
     * When `false`, the RNHost will use the size of the parent Jetpack Compose View.
     * Can be only set once on mount.
     * @default false
     */
    matchContents?: boolean;
    /**
     * The RN View to be hosted.
     */
    children: ReactElement;
    /**
     * Modifiers for the component.
     */
    modifiers?: ModifierConfig[];
    /**
     * Style applied to the host view's React Native shadow node. Useful for
     * controlling its layout position (e.g. `position: 'absolute'`) so the shadow
     * layout matches where the hosting Compose component draws the content —
     * important for `measure()`-based hit-testing such as `Pressable`.
     */
    style?: StyleProp<ViewStyle>;
}
export declare function RNHostView(props: RNHostProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=index.d.ts.map