/**
 * Bitmask of values that can be used to skip certain parts of the sourcers when generating a fingerprint.
 */
export enum SourceSkips {
  // Skip nothing
  None = 0,

  // Versions in app.json, including Android versionCode and iOS buildNumber
  ExpoConfigVersions = 1 << 0,

  // runtimeVersion in app.json if it is a string
  ExpoConfigRuntimeVersionIfString = 1 << 1,

  // App names in app.json, including shortName and description
  ExpoConfigNames = 1 << 2,

  // Android package name in app.json
  ExpoConfigAndroidPackage = 1 << 3,

  // iOS bundle identifier in app.json
  ExpoConfigIosBundleIdentifier = 1 << 4,

  // Schemes in app.json
  ExpoConfigSchemes = 1 << 5,

  // EAS project information in app.json
  ExpoConfigEASProject = 1 << 6,

  // Assets in app.json, including icons and splash assets
  ExpoConfigAssets = 1 << 7,

  // package.json scripts if android and ios items do not contain "run".
  // Because prebuild will change the scripts in package.json,
  // this is useful to generate a consistent fingerprint before and after prebuild.
  PackageJsonAndroidAndIosScriptsIfNotContainRun = 1 << 8,
}
