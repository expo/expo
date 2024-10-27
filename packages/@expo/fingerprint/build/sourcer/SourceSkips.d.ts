/**
 * Bitmask of values that can be used to skip certain parts of the sourcers when generating a fingerprint.
 */
export declare enum SourceSkips {
    None = 0,
    ExpoConfigVersions = 1,
    ExpoConfigRuntimeVersionIfString = 2,
    ExpoConfigNames = 4,
    ExpoConfigAndroidPackage = 8,
    ExpoConfigIosBundleIdentifier = 16,
    ExpoConfigSchemes = 32,
    ExpoConfigEASProject = 64,
    ExpoConfigAssets = 128,
    PackageJsonAndroidAndIosScriptsIfNotContainRun = 256
}
