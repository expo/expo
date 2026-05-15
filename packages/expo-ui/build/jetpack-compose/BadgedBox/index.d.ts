import { type ModifierConfig } from '../../types';
export type BadgedBoxProps = {
    /**
     * Modifiers for the component.
     */
    modifiers?: ModifierConfig[];
    /**
     * Children containing the main content and a `BadgedBox.Badge` slot.
     */
    children?: React.ReactNode;
};
/**
 * Slot for the badge overlay. Place a `Badge` component inside.
 */
declare function BadgeSlot(props: {
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
/**
 * A badged box matching Compose's `BadgedBox`.
 * Overlays a badge on top of content (for example, an icon).
 *
 * @see [Jetpack Compose BadgedBox](https://developer.android.com/develop/ui/compose/components/badges)
 */
declare function BadgedBoxComponent(props: BadgedBoxProps): import("react/jsx-runtime").JSX.Element;
declare namespace BadgedBoxComponent {
    var Badge: typeof BadgeSlot;
}
export { BadgedBoxComponent as BadgedBox };
//# sourceMappingURL=index.d.ts.map