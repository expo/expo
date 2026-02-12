/**
 * Flattens platform-specific options into a single options object for native modules.
 *
 * This utility merges common options with platform-specific options when running on that platform,
 * creating a flat structure suitable for passing to native modules. Platform-specific options
 * are only included when running on the corresponding platform.
 *
 * @param options An object containing common options and optional platform-specific properties (`android`, `ios`, `web`).
 * @returns A flattened object with platform options merged at the top level on the current platform.
 *
 * @example
 * ```ts
 * // Input on Android:
 * const options = {
 *   inputFormat: 'plainText',
 *   android: { isSensitive: true }
 * };
 *
 * // Output on Android:
 * // { inputFormat: 'plainText', isSensitive: true }
 *
 * // Output on iOS:
 * // { inputFormat: 'plainText' }
 * ```
 *
 * @example
 * ```ts
 * // Input on iOS:
 * const options = {
 *   inputFormat: 'plainText',
 *   ios: { localOnly: true }
 * };
 *
 * // Output on iOS:
 * // { inputFormat: 'plainText', localOnly: true }
 *
 * // Output on Android:
 * // { inputFormat: 'plainText' }
 * ```
 */
export declare function flattenPlatformOptions<CommonOptions extends object, AndroidOptions extends object = object, IOSOptions extends object = object, WebOptions extends object = object>(options: CommonOptions & {
    android?: AndroidOptions;
    ios?: IOSOptions;
    web?: WebOptions;
}): Omit<CommonOptions & {
    android?: AndroidOptions;
    ios?: IOSOptions;
    web?: WebOptions;
}, "ios" | "android" | "web">;
//# sourceMappingURL=options.d.ts.map