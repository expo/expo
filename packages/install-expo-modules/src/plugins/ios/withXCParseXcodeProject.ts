import { BaseMods, ConfigPlugin, IOSConfig, Mod, withMod } from '@expo/config-plugins';
import fs from 'fs';
import { ISA, build as xcbuild, parse as xcparse } from 'xcparse';
import type { BuildSettings, XCBuildConfiguration, XcodeProject } from 'xcparse';

export type XCParseXcodeProject = Partial<XcodeProject>;

export interface BuildSettingsExtended extends BuildSettings {
  SWIFT_OBJC_BRIDGING_HEADER?: string;
}

const MOD_NAME = 'xcparseXcodeproj';

export const withXCParseXcodeProjectBaseMod: ConfigPlugin = config => {
  return BaseMods.withGeneratedBaseMods(config, {
    platform: 'ios',
    skipEmptyMod: false,
    providers: {
      [MOD_NAME]: BaseMods.provider<XCParseXcodeProject>({
        getFilePath({ modRequest: { projectRoot } }) {
          return IOSConfig.Paths.getPBXProjectPath(projectRoot);
        },
        async read(filePath) {
          const content = await fs.promises.readFile(filePath, 'utf8');
          const pbxproj = xcparse(content);
          return pbxproj;
        },
        async write(filePath: string, { modResults }) {
          const content = xcbuild(modResults);
          await fs.promises.writeFile(filePath, content);
        },
      }),
    },
  });
};

export const withXCParseXcodeProject: ConfigPlugin<Mod<XCParseXcodeProject>> = (config, action) => {
  return withMod(config, {
    platform: 'ios',
    mod: MOD_NAME,
    action,
  });
};

export function getDesignatedSwiftBridgingHeaderFileReference(
  pbxproj: XCParseXcodeProject
): string | null {
  for (const section of Object.values(pbxproj.objects ?? {})) {
    if (section.isa === ISA.XCBuildConfiguration) {
      const buildConfigSection = section as XCBuildConfiguration;
      const buildSettings = buildConfigSection.buildSettings as BuildSettingsExtended;
      if (
        typeof buildSettings.PRODUCT_NAME !== 'undefined' &&
        typeof buildSettings.SWIFT_OBJC_BRIDGING_HEADER === 'string' &&
        buildSettings.SWIFT_OBJC_BRIDGING_HEADER
      ) {
        return buildSettings.SWIFT_OBJC_BRIDGING_HEADER;
      }
    }
  }
  return null;
}
