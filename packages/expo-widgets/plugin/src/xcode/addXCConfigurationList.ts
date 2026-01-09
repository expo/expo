import { XcodeProject } from 'expo/config-plugins';

interface AddXCConfigurationListProps {
  targetName: string;
  currentProjectVersion: string;
  bundleIdentifier: string;
  deploymentTarget: string;
  marketingVersion?: string;
}

export function addXCConfigurationList(
  xcodeProject: XcodeProject,
  props: AddXCConfigurationListProps
) {
  const commonBuildSettings: any = {
    PRODUCT_NAME: `"$(TARGET_NAME)"`,
    SWIFT_VERSION: '5.0',
    TARGETED_DEVICE_FAMILY: `"1,2"`,
    INFOPLIST_FILE: `${props.targetName}/Info.plist`,
    CURRENT_PROJECT_VERSION: `"${props.currentProjectVersion}"`,
    IPHONEOS_DEPLOYMENT_TARGET: `"${props.deploymentTarget}"`,
    PRODUCT_BUNDLE_IDENTIFIER: `"${props.bundleIdentifier}"`,
    GENERATE_INFOPLIST_FILE: `"YES"`,
    INFOPLIST_KEY_CFBundleDisplayName: props.targetName,
    INFOPLIST_KEY_NSHumanReadableCopyright: `""`,
    MARKETING_VERSION: `"${props.marketingVersion}"`,
    SWIFT_OPTIMIZATION_LEVEL: `"-Onone"`,
    CODE_SIGN_ENTITLEMENTS: `"${props.targetName}/${props.targetName}.entitlements"`,
    APPLICATION_EXTENSION_API_ONLY: '"YES"',
    // Mark the target as an Expo Widget
    // it is important because some functions in linked libraries (e.g. ExpoModulesCore) are not compatible with widgets.
    OTHER_SWIFT_FLAGS: '"$(inherited) -D IS_EXPO_WIDGET"',
  };

  const buildConfigurationsList = [
    {
      name: 'Debug',
      isa: 'XCBuildConfiguration',
      buildSettings: {
        ...commonBuildSettings,
      },
    },
    {
      name: 'Release',
      isa: 'XCBuildConfiguration',
      buildSettings: {
        ...commonBuildSettings,
      },
    },
  ];

  const xCConfigurationList = xcodeProject.addXCConfigurationList(
    buildConfigurationsList,
    'Release',
    `Build configuration list for PBXNativeTarget "${props.targetName}"`
  );

  return xCConfigurationList;
}
