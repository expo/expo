export declare function hasCustomScheme(): boolean;
/**
 * Collect a list of platform schemes from the manifest.
 *
 * This method is based on the `Scheme` modules from `@expo/config-plugins`
 * which are used for collecting the schemes before prebuilding a native app.
 *
 * - iOS: scheme -> ios.scheme -> ios.bundleIdentifier
 * - Android: scheme -> android.scheme -> android.package
 */
export declare function collectManifestSchemes(): string[];
/**
 * Ensure the user has linked the expo-constants manifest in bare workflow.
 */
export declare function hasConstantsManifest(): boolean;
export declare function resolveScheme(options: {
    scheme?: string;
    isSilent?: boolean;
}): string;
//# sourceMappingURL=Schemes.d.ts.map