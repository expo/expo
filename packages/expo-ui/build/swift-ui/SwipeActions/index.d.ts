import { type CommonViewModifierProps } from '../types';
export type SwipeActionsEdge = 'leading' | 'trailing';
export type SwipeActionsProps = {
    /**
     * The regular content and `SwipeActions.Actions` action groups.
     */
    children: React.ReactNode;
} & CommonViewModifierProps;
export type SwipeActionsGroupProps = {
    /**
     * The edge where these swipe actions are revealed.
     * @default 'trailing'
     */
    edge?: SwipeActionsEdge;
    /**
     * Whether a full swipe automatically performs the first action in this group.
     * @default true
     */
    allowsFullSwipe?: boolean;
    /**
     * The buttons revealed when the user swipes from this edge.
     */
    children: React.ReactNode;
};
/**
 * The buttons revealed when the user swipes the regular content from an edge.
 */
export declare function Actions({ edge, allowsFullSwipe, children, }: SwipeActionsGroupProps): import("react/jsx-runtime").JSX.Element;
/**
 * Applies native SwiftUI swipe actions to its non-slot children.
 */
declare function SwipeActionsComponent(props: SwipeActionsProps): import("react/jsx-runtime").JSX.Element;
declare const SwipeActions: typeof SwipeActionsComponent & {
    Actions: typeof Actions;
};
export { SwipeActions };
//# sourceMappingURL=index.d.ts.map