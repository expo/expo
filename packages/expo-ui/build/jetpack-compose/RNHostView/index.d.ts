import type { ReactElement } from 'react';
import type { LayoutChangeEvent } from 'react-native';
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
     * Called on mount and whenever this view's layout in the React Native view tree changes.
     * With `matchContents`, the reported size is the one measured from the hosted view.
     */
    onLayout?: (event: LayoutChangeEvent) => void;
    /**
     * The RN View to be hosted.
     */
    children: ReactElement;
    /**
     * Modifiers for the component.
     */
    modifiers?: ModifierConfig[];
}
export declare function RNHostView(props: RNHostProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=index.d.ts.map