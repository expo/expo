import { XcodeProject } from '@expo/config-plugins';

export function addXCConfigurationList(
  xcodeProject: XcodeProject,
  targetName: string,
  bundleIdentifier: string,
  deploymentTarget: string,
  currentProjectVersion: string,
  marketingVersion: string
) {
  // Based on the default output of Xcode when adding a sharing extension target
  const commonSettings = {
    ASSETCATALOG_COMPILER_GENERATE_SWIFT_ASSET_SYMBOL_EXTENSIONS: 'YES',
    CLANG_ANALYZER_NONNULL: 'YES',
    CLANG_ANALYZER_NUMBER_OBJECT_CONVERSION: 'YES_AGGRESSIVE',
    CODE_SIGN_STYLE: 'Automatic',
    CODE_SIGN_ENTITLEMENTS: `"${targetName}/${targetName}.entitlements"`,
    CURRENT_PROJECT_VERSION: `"${currentProjectVersion}"`,
    ENABLE_USER_SCRIPT_SANDBOXING: 'YES',
    GENERATE_INFOPLIST_FILE: 'NO',
    INFOPLIST_FILE: `"${targetName}/Info.plist"`,
    INFOPLIST_KEY_CFBundleDisplayName: `"${targetName}"`,
    INFOPLIST_KEY_NSHumanReadableCopyright: '""',
    IPHONEOS_DEPLOYMENT_TARGET: `"${deploymentTarget}"`,
    LD_RUNPATH_SEARCH_PATHS: [
      '"$(inherited)"',
      '"@executable_path/Frameworks"',
      '"@executable_path/../../Frameworks"',
    ],
    LOCALIZATION_PREFERS_STRING_CATALOGS: 'YES',
    MARKETING_VERSION: `${marketingVersion}`,
    MTL_FAST_MATH: 'YES',
    PRODUCT_BUNDLE_IDENTIFIER: `"${bundleIdentifier}"`,
    PRODUCT_NAME: '"$(TARGET_NAME)"',
    SKIP_INSTALL: 'YES',
    STRING_CATALOG_GENERATE_SYMBOLS: 'YES',
    SWIFT_APPROACHABLE_CONCURRENCY: 'YES',
    SWIFT_EMIT_LOC_STRINGS: 'YES',
    SWIFT_UPCOMING_FEATURE_MEMBER_IMPORT_VISIBILITY: 'YES',
    SWIFT_VERSION: '5.0',
    TARGETED_DEVICE_FAMILY: '"1,2"',
  };

  const debugSpecifics = {
    DEBUG_INFORMATION_FORMAT: 'dwarf',
    MTL_ENABLE_DEBUG_INFO: 'INCLUDE_SOURCE',
    SWIFT_ACTIVE_COMPILATION_CONDITIONS: '"DEBUG $(inherited)"',
    SWIFT_OPTIMIZATION_LEVEL: '"-Onone"',
  };

  const releaseSpecifics = {
    COPY_PHASE_STRIP: 'NO',
    DEBUG_INFORMATION_FORMAT: '"dwarf-with-dsym"',
    SWIFT_COMPILATION_MODE: 'wholemodule',
  };

  const xCConfigurationList = [
    {
      name: 'Debug',
      isa: 'XCBuildConfiguration',
      buildSettings: {
        ...commonSettings,
        ...debugSpecifics,
      },
    },
    {
      name: 'Release',
      isa: 'XCBuildConfiguration',
      buildSettings: {
        ...commonSettings,
        ...releaseSpecifics,
      },
    },
  ];

  return xcodeProject.addXCConfigurationList(
    xCConfigurationList,
    'Release',
    `Build configuration list for PBXNativeTarget "${targetName}"`
  );
}
