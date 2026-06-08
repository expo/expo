import { type ColorValue } from 'react-native';
import { type ModifierConfig } from '../../types';
export type BadgeProps = {
    /**
     * Background color of the badge.
     * @default BadgeDefaults.containerColor
     */
    containerColor?: ColorValue;
    /**
     * Content color inside the badge (text/icon tint).
     * @default BadgeDefaults.contentColor
     */
    contentColor?: ColorValue;
    /**
     * Modifiers for the component.
     */
    modifiers?: ModifierConfig[];
    /**
     * Optional content inside the badge (for example, a `Text` with a count).
     * When omitted, renders as a small indicator dot.
     */
    children?: React.ReactNode;
};
/**
 * A badge component matching Compose's `Badge`.
 * Renders as a small colored indicator dot, or with content (for example, a count).
 *
 * @see [Jetpack Compose Badge](https://developer.android.com/develop/ui/compose/components/badges)
 */
export declare function Badge(props: BadgeProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=index.d.ts.map