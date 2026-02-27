import { type MaterialIcon } from '../Button/types';
import { type ExpoModifier } from '../../types';
/**
 * A single item in the navigation rail.
 */
export type NavigationRailItem = {
    /**
     * The Material Icon to display for this item.
     * Uses the format `variant.IconName` (e.g. `filled.Home`).
     */
    icon: MaterialIcon;
    /**
     * The text label for this item.
     */
    label?: string;
    /**
     * The badge text to display on this item.
     */
    badge?: string;
};
type HeaderProps = {
    children: React.ReactNode;
};
export type NavigationRailProps = {
    /**
     * The navigation rail items to display.
     */
    items: NavigationRailItem[];
    /**
     * The index of the currently selected item.
     * @default 0
     */
    selectedIndex: number;
    /**
     * Callback that is called when a navigation rail item is selected.
     */
    onItemSelected?: (event: {
        nativeEvent: {
            index: number;
        };
    }) => void;
    /**
     * Controls when labels are shown on rail items.
     * - `auto` - Uses the platform default (labels always shown).
     * - `selected` - Labels are only shown on the selected item.
     * - `labeled` - Labels are always shown on all items.
     * - `unlabeled` - Labels are never shown.
     * @default 'auto'
     */
    labelVisibility?: 'auto' | 'selected' | 'labeled' | 'unlabeled';
    /**
     * Children containing the Header slot.
     */
    children?: React.ReactNode;
    /**
     * Modifiers for the component.
     */
    modifiers?: ExpoModifier[];
};
/**
 * Header slot for NavigationRail, rendered above the rail items.
 * Typically used for a FAB or logo.
 *
 * @platform android
 */
declare function NavigationRailHeader(props: HeaderProps): import("react").JSX.Element;
/**
 * A Material Design 3 navigation rail for vertical navigation on larger screens.
 *
 * @platform android
 */
declare function NavigationRailComponent(props: NavigationRailProps): import("react").JSX.Element;
declare namespace NavigationRailComponent {
    var Header: typeof NavigationRailHeader;
}
export { NavigationRailComponent as NavigationRail };
//# sourceMappingURL=index.d.ts.map