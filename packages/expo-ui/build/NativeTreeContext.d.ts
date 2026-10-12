/**
 * `true` inside a `Host`, where SwiftUI or Jetpack Compose renders the content. `RNHostView` sets it
 * back to `false`, because its children are React Native views again.
 */
export declare const NativeTreeContext: import("react").Context<boolean>;
export declare function useIsInsideNativeTree(): boolean;
/**
 * Warns once in development when a `Host` renders directly inside another `Host`'s native content.
 */
export declare function useWarnIfNestedHost(layoutSystem: 'SwiftUI' | 'Jetpack Compose'): void;
//# sourceMappingURL=NativeTreeContext.d.ts.map