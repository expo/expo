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
export declare function hasConstantsManifest(): boolean;
export declare function resolveScheme(props: {
    scheme?: string;
    isSilent?: boolean;
}): string;
