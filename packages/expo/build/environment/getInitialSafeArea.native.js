import { TurboModuleRegistry } from 'react-native';
const DEFAULT_SAFE_AREA = { top: 0, bottom: 0, left: 0, right: 0 };
/**
 * Get the best estimate safe area before native modules have fully loaded.
 * This is a hack to get the safe area insets without explicitly depending on react-native-safe-area-context.
 */
export function getInitialSafeArea() {
    const RNCSafeAreaContext = TurboModuleRegistry.get('RNCSafeAreaContext');
    // @ts-ignore: we're not using the spec so the return type of getConstants() is {}
    const initialWindowMetrics = RNCSafeAreaContext?.getConstants()?.initialWindowMetrics;
    return initialWindowMetrics?.insets ?? DEFAULT_SAFE_AREA;
}
//# sourceMappingURL=getInitialSafeArea.native.js.map