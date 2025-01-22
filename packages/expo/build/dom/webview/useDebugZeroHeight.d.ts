import { type DOMProps } from '../dom.types';
/**
 * Debug only hook to help identify zero height issues in the DOM component.
 */
export declare function useDebugZeroHeight(dom: DOMProps): {
    debugZeroHeightStyle: import("react-native").StyleProp<import("react-native").ViewStyle>;
    debugOnLayout: (event: import("react-native").LayoutChangeEvent) => void;
};
//# sourceMappingURL=useDebugZeroHeight.d.ts.map