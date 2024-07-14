import { findSchemeNames, findSchemePaths } from './Paths';
import { findSignableTargets, TargetType } from './Target';
import { getPbxproj, unquote } from './utils/Xcodeproj';
import { readXMLAsync } from '../utils/XML';

interface SchemeXML {
  Scheme?: {
    BuildAction?: {
      BuildActionEntries?: {
        BuildActionEntry?: BuildActionEntryType[];
      }[];
    }[];
    ArchiveAction?: {
      $?: {
        buildConfiguration?: string;
      };
    }[];
  };
}

interface BuildActionEntryType {
  BuildableReference?: {
    $?: {
      BlueprintName?: string;
      BuildableName?: string;
    };
  }[];
}

export const getSchemesFromXcodeproj =
  (applePlatform: 'ios' | 'macos') =>
  (projectRoot: string): string[] =>
    findSchemeNames(applePlatform)(projectRoot);

export const getRunnableSchemesFromXcodeproj =
  (applePlatform: 'ios' | 'macos') =>
  (
    projectRoot: string,
    { configuration = 'Debug' }: { configuration?: 'Debug' | 'Release' } = {}
  ): { name: string; osType: string; type: string }[] => {
    const project = getPbxproj(applePlatform)(projectRoot);

    return findSignableTargets(project).map(([, target]) => {
      let osType = applePlatform === 'ios' ? 'iOS' : 'macOS';
      const type = unquote(target.productType);

      if (type === TargetType.WATCH) {
        osType = 'watchOS';
      } else if (
        // (apps) com.apple.product-type.application
        // (app clips) com.apple.product-type.application.on-demand-install-capable
        // NOTE(EvanBacon): This matches against `watchOS` as well so we check for watch first.
        type.startsWith(TargetType.APPLICATION)
      ) {
        // Attempt to resolve the platform SDK for each target so we can filter devices.
        const xcConfigurationList =
          project.hash.project.objects.XCConfigurationList[target.buildConfigurationList];

        if (xcConfigurationList) {
          const buildConfiguration =
            xcConfigurationList.buildConfigurations.find(
              (value: { comment: string; value: string }) => value.comment === configuration
            ) || xcConfigurationList.buildConfigurations[0];
          if (buildConfiguration?.value) {
            const xcBuildConfiguration =
              project.hash.project.objects.XCBuildConfiguration?.[buildConfiguration.value];

            const buildSdkRoot = xcBuildConfiguration.buildSettings.SDKROOT;
            if (
              buildSdkRoot === 'appletvos' ||
              'TVOS_DEPLOYMENT_TARGET' in xcBuildConfiguration.buildSettings
            ) {
              // Is a TV app...
              osType = 'tvOS';
            } else if (buildSdkRoot === 'iphoneos') {
              osType = 'iOS';
            } else if (buildSdkRoot === 'macosx') {
              osType = 'macOS';
            }
          }
        }
      }

      return {
        name: unquote(target.name),
        osType,
        type: unquote(target.productType),
      };
    });
  };

const readSchemeAsync =
  (applePlatform: 'ios' | 'macos') =>
  async (projectRoot: string, scheme: string): Promise<SchemeXML | undefined> => {
    const allSchemePaths = findSchemePaths(applePlatform)(projectRoot);
    const re = new RegExp(`/${scheme}.xcscheme`, 'i');
    const schemePath = allSchemePaths.find((i) => re.exec(i));
    if (schemePath) {
      return (await readXMLAsync({ path: schemePath })) as unknown as SchemeXML | undefined;
    } else {
      throw new Error(`scheme '${scheme}' does not exist, make sure it's marked as shared`);
    }
  };

export const getApplicationTargetNameForSchemeAsync =
  (applePlatform: 'ios' | 'macos') =>
  async (projectRoot: string, scheme: string): Promise<string> => {
    const schemeXML = await readSchemeAsync(applePlatform)(projectRoot, scheme);
    const buildActionEntry =
      schemeXML?.Scheme?.BuildAction?.[0]?.BuildActionEntries?.[0]?.BuildActionEntry;
    const targetName =
      buildActionEntry?.length === 1
        ? getBlueprintName(buildActionEntry[0])
        : getBlueprintName(
            buildActionEntry?.find((entry) => {
              return entry.BuildableReference?.[0]?.['$']?.BuildableName?.endsWith('.app');
            })
          );
    if (!targetName) {
      throw new Error(`${scheme}.xcscheme seems to be corrupted`);
    }
    return targetName;
  };

export const getArchiveBuildConfigurationForSchemeAsync =
  (applePlatform: 'ios' | 'macos') =>
  async (projectRoot: string, scheme: string): Promise<string> => {
    const schemeXML = await readSchemeAsync(applePlatform)(projectRoot, scheme);
    const buildConfiguration = schemeXML?.Scheme?.ArchiveAction?.[0]?.['$']?.buildConfiguration;
    if (!buildConfiguration) {
      throw new Error(`${scheme}.xcscheme seems to be corrupted`);
    }
    return buildConfiguration;
  };

function getBlueprintName(entry?: BuildActionEntryType): string | undefined {
  return entry?.BuildableReference?.[0]?.['$']?.BlueprintName;
}
