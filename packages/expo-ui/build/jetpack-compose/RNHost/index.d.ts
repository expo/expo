import React from 'react';
import { ExpoModifier } from '../../types';
import { PrimitiveBaseProps } from '../layout';
interface RNHostProps extends PrimitiveBaseProps {
    /**
     * When true, the RNHost will update its size in the Jetpack Compose view tree to match the children's size.
     * When false, the RNHost will use the size of the parent Jetpack Compose View.
     * Can be only set once on mount.
     * @default false
     */
    matchContents?: boolean;
    /**
     * The RN View to be hosted.
     */
    children: React.ReactElement;
    /**
     * Modifiers for the component.
     */
    modifiers?: ExpoModifier[];
    /**
     * When true, the RNHost will enable vertical scrolling.
     * @see Official [Jetpack Compose documentation](androidx.compose.ui.Modifier).verticalScroll(androidx.compose.foundation.ScrollState,kotlin.Boolean,androidx.compose.foundation.gestures.FlingBehavior,kotlin.Boolean)
     */
    verticalScrollEnabled?: boolean;
}
export declare function RNHost(props: RNHostProps): React.JSX.Element;
export {};
//# sourceMappingURL=index.d.ts.map