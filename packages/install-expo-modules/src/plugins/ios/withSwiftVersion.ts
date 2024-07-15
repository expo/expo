import { type ConfigPlugin, withXcodeProject } from '@expo/config-plugins';
import type { XcodeProject } from 'xcode';

export function setSwiftVersionIfNotPresent(
  swiftVersionToSet: string,
  { project }: { project: XcodeProject }
): XcodeProject {
  const configurations = Object.values(project.hash.project.objects['XCBuildConfiguration']);

  configurations.forEach((config) => {
    if (config.buildSettings) {
      config.buildSettings['SWIFT_VERSION'] ??= swiftVersionToSet;
    }
  });

  return project;
}

export const withSwiftVersion: ConfigPlugin<string> = (config, swiftVersion) => {
  return withXcodeProject(config, async (config) => {
    config.modResults = setSwiftVersionIfNotPresent(swiftVersion, {
      project: config.modResults,
    });
    return config;
  });
};
