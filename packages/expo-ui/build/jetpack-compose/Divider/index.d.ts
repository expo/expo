import { type ColorValue } from 'react-native';
import { type ModifierConfig } from '../../types';
export type DividerCommonConfig = {
    /**
     * Thickness of the divider line. Accepts dp values; use `StyleSheet.hairlineWidth` for a single-pixel line.
     */
    thickness?: number;
    /**
     * Color of the divider line.
     */
    color?: ColorValue;
    /**
     * Modifiers for the component.
     */
    modifiers?: ModifierConfig[];
};
/**
 * A horizontal divider line that groups content in lists and layouts,
 * matching Compose's `HorizontalDivider`.
 */
export declare const HorizontalDivider: import("react").ComponentType<DividerCommonConfig>;
/**
 * A vertical divider line that groups content in layouts,
 * matching Compose's `VerticalDivider`.
 */
export declare const VerticalDivider: import("react").ComponentType<DividerCommonConfig>;
//# sourceMappingURL=index.d.ts.map