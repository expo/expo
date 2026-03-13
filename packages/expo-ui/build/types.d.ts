/**
 * @hidden
 */
export type ViewEvent<Name extends string, Data> = Record<Name, Data extends object ? ((event: {
    nativeEvent: Data;
}) => void) | undefined : (() => void) | undefined>;
/**
 * Modifier configuration for native views.
 * This is the JSON Config pattern used by both iOS (SwiftUI) and Android (Jetpack Compose).
 */
export interface ModifierConfig {
    $type: string;
    $scope?: string;
    [key: string]: unknown;
}
/**
 * @deprecated Use ModifierConfig instead. ExpoModifier (SharedRef pattern) has been replaced
 * with JSON Config pattern for better DX and platform consistency.
 */
export type ExpoModifier = ModifierConfig;
//# sourceMappingURL=types.d.ts.map