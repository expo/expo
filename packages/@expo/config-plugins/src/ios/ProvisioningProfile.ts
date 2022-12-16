import fs from 'fs';

import { findFirstNativeTarget, findNativeTargetByName } from './Target';
import {
  ConfigurationSectionEntry,
  getBuildConfigurationsForListId,
  getPbxproj,
  getProjectSection,
  isNotComment,
  ProjectSectionEntry,
} from './utils/Xcodeproj';
import { trimQuotes } from './utils/string';

type ProvisioningProfileSettings = {
  targetName?: string;
  appleTeamId: string;
  profileName: string;
  buildConfiguration?: string;
};

export function setProvisioningProfileForPbxproj(
  projectRoot: string,
  {
    targetName,
    profileName,
    appleTeamId,
    buildConfiguration = 'Release',
  }: ProvisioningProfileSettings
): void {
  const project = getPbxproj(projectRoot);

  const nativeTargetEntry = targetName
    ? findNativeTargetByName(project, targetName)
    : findFirstNativeTarget(project);
  const [nativeTargetId, nativeTarget] = nativeTargetEntry;

  const quotedAppleTeamId = ensureQuotes(appleTeamId);

  getBuildConfigurationsForListId(project, nativeTarget.buildConfigurationList)
    .filter(([, item]: ConfigurationSectionEntry) => trimQuotes(item.name) === buildConfiguration)
    .forEach(([, item]: ConfigurationSectionEntry) => {
      item.buildSettings.PROVISIONING_PROFILE_SPECIFIER = `"${profileName}"`;
      item.buildSettings.DEVELOPMENT_TEAM = quotedAppleTeamId;
      item.buildSettings.CODE_SIGN_IDENTITY = '"iPhone Distribution"';
      item.buildSettings.CODE_SIGN_STYLE = 'Manual';
    });

  Object.entries(getProjectSection(project))
    .filter(isNotComment)
    .forEach(([, item]: ProjectSectionEntry) => {
      if (!item.attributes.TargetAttributes[nativeTargetId]) {
        item.attributes.TargetAttributes[nativeTargetId] = {};
      }
      item.attributes.TargetAttributes[nativeTargetId].DevelopmentTeam = quotedAppleTeamId;
      item.attributes.TargetAttributes[nativeTargetId].ProvisioningStyle = 'Manual';
    });

  fs.writeFileSync(project.filepath, project.writeSync());
}

const ensureQuotes = (value: string) => {
  if (!value.match(/^['"]/)) {
    return `"${value}"`;
  }
  return value;
};
