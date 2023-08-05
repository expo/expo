import { IOSConfig, XcodeProject } from '@expo/config-plugins';
import fs from 'fs';

export type CodeSigningInfo = Record<
  string,
  {
    developmentTeams: string[];
    provisioningProfiles: string[];
  }
>;

/** Find the development team and provisioning profile that's currently in use by the Xcode project. */
export function getCodeSigningInfoForPbxproj(projectRoot: string): CodeSigningInfo {
  const project = IOSConfig.XcodeUtils.getPbxproj(projectRoot);
  const targets = IOSConfig.Target.findSignableTargets(project);

  const signingInfo: CodeSigningInfo = {};
  for (const [nativeTargetId, nativeTarget] of targets) {
    const developmentTeams: string[] = [];
    const provisioningProfiles: string[] = [];

    IOSConfig.XcodeUtils.getBuildConfigurationsForListId(
      project,
      nativeTarget.buildConfigurationList
    )
      .filter(
        ([, item]: IOSConfig.XcodeUtils.ConfigurationSectionEntry) =>
          item.buildSettings.PRODUCT_NAME
      )
      .forEach(([, item]: IOSConfig.XcodeUtils.ConfigurationSectionEntry) => {
        const { DEVELOPMENT_TEAM, PROVISIONING_PROFILE } = item.buildSettings;
        if (
          typeof DEVELOPMENT_TEAM === 'string' &&
          // If the user selects "Team: none" in Xcode, it'll be an empty string.
          !!DEVELOPMENT_TEAM &&
          // xcode package sometimes reads an empty string as a quoted empty string.
          DEVELOPMENT_TEAM !== '""'
        ) {
          developmentTeams.push(DEVELOPMENT_TEAM);
        }
        if (typeof PROVISIONING_PROFILE === 'string' && !!PROVISIONING_PROFILE) {
          provisioningProfiles.push(PROVISIONING_PROFILE);
        }
      });
    signingInfo[nativeTargetId] = {
      developmentTeams,
      provisioningProfiles,
    };
  }

  return signingInfo;
}

/**
 * Set the development team and configure the Xcode project for automatic code signing,
 * this helps us resolve the code signing on subsequent runs and emulates Xcode behavior.
 *
 * @param props.project xcode project object from `xcode` package.
 * @param props.appleTeamId Apple Team ID to use for code signing.
 */
export function mutateXcodeProjectWithAutoCodeSigningInfo({
  project,
  appleTeamId,
}: {
  project: XcodeProject;
  appleTeamId: string;
}): XcodeProject {
  const targets = IOSConfig.Target.findSignableTargets(project);

  const quotedAppleTeamId = ensureQuotes(appleTeamId);

  for (const [nativeTargetId, nativeTarget] of targets) {
    IOSConfig.XcodeUtils.getBuildConfigurationsForListId(
      project,
      nativeTarget.buildConfigurationList
    )
      .filter(
        ([, item]: IOSConfig.XcodeUtils.ConfigurationSectionEntry) =>
          item.buildSettings.PRODUCT_NAME
      )
      .forEach(([, item]: IOSConfig.XcodeUtils.ConfigurationSectionEntry) => {
        item.buildSettings.DEVELOPMENT_TEAM = quotedAppleTeamId;
        item.buildSettings.CODE_SIGN_IDENTITY = '"Apple Development"';
        item.buildSettings.CODE_SIGN_STYLE = 'Automatic';
      });

    Object.entries(IOSConfig.XcodeUtils.getProjectSection(project))
      .filter(IOSConfig.XcodeUtils.isNotComment)
      .forEach(([, item]: IOSConfig.XcodeUtils.ProjectSectionEntry) => {
        if (!item.attributes.TargetAttributes) {
          item.attributes.TargetAttributes = {};
        }

        if (!item.attributes.TargetAttributes[nativeTargetId]) {
          item.attributes.TargetAttributes[nativeTargetId] = {};
        }

        item.attributes.TargetAttributes[nativeTargetId].DevelopmentTeam = quotedAppleTeamId;
        item.attributes.TargetAttributes[nativeTargetId].ProvisioningStyle = 'Automatic';
      });
  }

  return project;
}

/**
 * Configures the Xcode project for automatic code signing and persists the results.
 */
export function setAutoCodeSigningInfoForPbxproj(
  projectRoot: string,
  { appleTeamId }: { appleTeamId: string }
): void {
  const project = IOSConfig.XcodeUtils.getPbxproj(projectRoot);
  mutateXcodeProjectWithAutoCodeSigningInfo({ project, appleTeamId });

  fs.writeFileSync(project.filepath, project.writeSync());
}

const ensureQuotes = (value: string) => {
  if (!value.match(/^['"]/)) {
    return `"${value}"`;
  }
  return value;
};
