import { type ModifierConfig } from '../../types';
export type SwipeToDismissBoxProps = {
    /**
     * Whether to allow dismissing by swiping from start to end (left-to-right in LTR).
     * @default true
     */
    enableDismissFromStartToEnd?: boolean;
    /**
     * Whether to allow dismissing by swiping from end to start (right-to-left in LTR).
     * @default true
     */
    enableDismissFromEndToStart?: boolean;
    /**
     * Whether swipe gestures are enabled.
     * @default true
     */
    gesturesEnabled?: boolean;
    /**
     * Callback when the item is swiped from start to end.
     */
    onStartToEnd?: () => void;
    /**
     * Callback when the item is swiped from end to start.
     */
    onEndToStart?: () => void;
    /**
     * Modifiers for the component.
     */
    modifiers?: ModifierConfig[];
    /**
     * Children containing the main content and optional BackgroundContent slot.
     */
    children?: React.ReactNode;
};
/**
 * A swipe-to-dismiss container matching Compose's `SwipeToDismissBox`.
 * Wraps any content (e.g., a ListItem) and provides swipe gestures.
 *
 * @see [Jetpack Compose SwipeToDismissBox](https://developer.android.com/develop/ui/compose/touch-input/user-interactions/swipe-to-dismiss)
 */
declare function SwipeToDismissBoxComponent(props: SwipeToDismissBoxProps): import("react").JSX.Element;
declare namespace SwipeToDismissBoxComponent {
    var BackgroundContent: (props: {
        children: React.ReactNode;
    }) => import("react").JSX.Element;
    var BackgroundStartToEnd: (props: {
        children: React.ReactNode;
    }) => import("react").JSX.Element;
    var BackgroundEndToStart: (props: {
        children: React.ReactNode;
    }) => import("react").JSX.Element;
}
export { SwipeToDismissBoxComponent as SwipeToDismissBox };
//# sourceMappingURL=index.d.ts.map