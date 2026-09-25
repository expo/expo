import { AndroidConfig, IOSConfig, type ExportedConfigWithProps } from '@expo/config-plugins';
import type { ExpoConfig } from '@expo/config-types';

const { createBuildGradlePropsConfigPlugin } = AndroidConfig.BuildProperties;
const { createBuildPodfilePropsConfigPlugin } = IOSConfig.BuildProperties;

const APPLICATION_PRODUCT_TYPE = 'com.apple.product-type.application';

const unquote = (value: string) => value.replace(/^"(.*)"$/, '$1');

// The Xcode target name is the source of truth: autolinking matches this value
// against the CocoaPods target name (`Pods-<TargetName>`), which follows the
// target, not the `ios/<dir>` folder that `modRequest.projectName` derives from.
// Keep in sync with `getMainApplicationTargetUuid` in `@expo/inline-modules`:
// both resolvers use the same tiebreak when several application targets exist
// — the on-disk project name first, then the sanitized app name.
export function resolveMainTargetName(
  projectRoot: string,
  fallbackName: string | undefined
): string {
  let projectPath: string | null = null;
  try {
    projectPath = IOSConfig.Paths.getPBXProjectPath(projectRoot);
  } catch {
    // No ios project on disk (e.g. introspection); use the folder-derived name.
  }
  if (projectPath) {
    // Parse errors surface: a corrupt pbxproj must not silently fall back to a
    // name that may match no target.
    const pbxProject = IOSConfig.XcodeUtils.getPbxproj(projectRoot);
    const nativeTargets = pbxProject.hash.project.objects.PBXNativeTarget ?? {};
    const applicationTargetNames = pbxProject
      .getFirstProject()
      .firstProject.targets.map((target: { value: string }) => {
        const nativeTarget = nativeTargets[target.value] as
          | { productType?: string; name?: string }
          | undefined;
        return typeof nativeTarget?.productType === 'string' &&
          unquote(nativeTarget.productType) === APPLICATION_PRODUCT_TYPE
          ? unquote(String(nativeTarget.name))
          : null;
      })
      .filter((name): name is string => name !== null);
    if (applicationTargetNames.length) {
      // When several application targets exist (e.g. a paired watchOS app),
      // prefer the one named after the source folder.
      return (
        applicationTargetNames.find((name) => name === fallbackName) ?? applicationTargetNames[0]!
      );
    }
  }
  if (!fallbackName) {
    throw new Error(
      'Inline modules could not resolve the main Xcode target to write into Podfile.properties.json. ' +
        'Set `expo.experiments.inlineModules.xcodeProjectTargets` in your app config to name the targets explicitly.'
    );
  }
  return fallbackName;
}

export const withInlineModules = (config: ExpoConfig, props: any) => {
  config = createBuildGradlePropsConfigPlugin(
    [
      {
        propName: 'expo.inlineModules.watchedDirectories',
        propValueGetter: (conf) => {
          if (!conf.experiments?.inlineModules) {
            return JSON.stringify([]);
          }
          return JSON.stringify(conf.experiments?.inlineModules?.watchedDirectories ?? []);
        },
      },
    ],
    'withAndroidInlineModules'
  )(config);

  config = createBuildPodfilePropsConfigPlugin(
    [
      {
        propName: 'expo.inlineModules.watchedDirectories',
        propValueGetter: (conf) => {
          if (!conf.experiments?.inlineModules) {
            return JSON.stringify([]);
          }
          return JSON.stringify(conf.experiments?.inlineModules?.watchedDirectories ?? []);
        },
      },
      {
        propName: 'expo.inlineModules.xcodeProjectTargets',
        propValueGetter: (conf) => {
          if (!conf.experiments?.inlineModules) {
            // Skip the pbxproj parse in `resolveMainTargetName` for projects
            // that don't use inline modules.
            return JSON.stringify({ targets: [] });
          }
          const xcodeProjectTargets = conf.experiments?.inlineModules?.xcodeProjectTargets;
          if (!xcodeProjectTargets) {
            const modRequest = (conf as ExportedConfigWithProps).modRequest;
            return JSON.stringify({
              mainTarget: resolveMainTargetName(
                modRequest?.projectRoot ?? '',
                modRequest?.projectName
              ),
              targets: [],
            });
          }
          return JSON.stringify({ targets: xcodeProjectTargets });
        },
      },
    ],
    'withIosInlineModules'
  )(config);

  return config;
};

export default withInlineModules;
