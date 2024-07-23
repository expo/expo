import { type ConfigPlugin } from '@expo/config-plugins';
import { ISA, type XCBuildConfiguration } from 'xcparse';

import { withXCParseXcodeProject, XCParseXcodeProject } from './withXCParseXcodeProject';

export function setSwiftVersionIfNotPresent(
  swiftVersionToSet: string,
  { project }: { project: XCParseXcodeProject }
): XCParseXcodeProject {
  for (const section of Object.values(project.objects ?? {})) {
    if (section.isa === ISA.XCBuildConfiguration) {
      const buildConfigSection = section as XCBuildConfiguration;
      const buildSettings = buildConfigSection.buildSettings;
      if (buildSettings) {
        buildSettings.SWIFT_VERSION ??= swiftVersionToSet;
      }
    }
  }

  return project;
}

export const withSwiftVersion: ConfigPlugin<string> = (config, swiftVersion) => {
  return withXCParseXcodeProject(config, async (config) => {
    config.modResults = setSwiftVersionIfNotPresent(swiftVersion, {
      project: config.modResults,
    });
    return config;
  });
};
