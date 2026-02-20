export const Constants = {
  BuildPhase: {
    PatchExpoPhase: 'Patch ExpoModulesProvider',
    RNBundlePhase: 'Bundle React Native code and images',
    Script: 'PBXShellScriptBuildPhase',
    Sources: 'PBXSourcesBuildPhase',
  },
  Target: {
    ApplicationProductType: '"com.apple.product-type.application"',
    Framework: 'framework',
  },
  Utils: {
    XCEmptyString: '""', // Empty string needs to be double quoted
  },
} as const;
