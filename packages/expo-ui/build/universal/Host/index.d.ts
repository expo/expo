import type { UniversalHostProps } from './types';
/**
 * A bridging container that hosts SwiftUI views on iOS and Jetpack Compose views on Android.
 * On platforms without a native UI-toolkit binding (web, RN fallback), renders a plain `View`.
 * The `colorScheme`, `layoutDirection`, and `matchContents` props are accepted for API parity but have no effect.
 */
export declare function Host({ children, colorScheme, ignoreSafeArea, layoutDirection, matchContents, onLayout, onLayoutContent, style, useViewportSizeMeasurement, ...rest }: UniversalHostProps): import("react/jsx-runtime").JSX.Element;
export type { UniversalHostProps } from './types';
//# sourceMappingURL=index.d.ts.map