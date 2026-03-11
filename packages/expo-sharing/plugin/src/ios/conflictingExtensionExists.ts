import { XcodeProject } from '@expo/config-plugins';

type conflictingExtensionResult = 'doesnt-exist' | 'exists' | 'exists-conflicting';

export function conflictingExtensionExists(
  xcodeProject: XcodeProject,
  targetName: string,
  bundleIdentifier: string
): conflictingExtensionResult {
  const nativeTargets = xcodeProject.pbxNativeTargetSection();
  const existingTarget: any = Object.values(nativeTargets).find(
    (target: any) => target.name && unquote(target.name) === targetName
  );

  if (existingTarget) {
    const buildConfigurations = xcodeProject.pbxXCBuildConfigurationSection();
    const configurationList =
      xcodeProject.pbxXCConfigurationList()[existingTarget.buildConfigurationList];
    const buildConfiguration = buildConfigurations[configurationList.buildConfigurations[0].value];
    const existingBundleIdentifier = unquote(
      buildConfiguration.buildSettings.PRODUCT_BUNDLE_IDENTIFIER
    );

    return existingBundleIdentifier === bundleIdentifier ? 'exists' : 'exists-conflicting';
  }
  return 'doesnt-exist';
}

function unquote(str: string) {
  if (str) return str.replace(/^"(.*)"$/, '$1');
  return str;
}
