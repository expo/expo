/**
 * Get the best estimate safe area before native modules have fully loaded.
 * This is a hack to get the safe area insets without explicitly depending on react-native-safe-area-context.
 */
export declare function getInitialSafeArea(): {
    top: number;
    bottom: number;
    left: number;
    right: number;
};
//# sourceMappingURL=getInitialSafeArea.native.d.ts.map