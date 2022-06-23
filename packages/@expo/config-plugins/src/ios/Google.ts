import { ExpoConfig } from '@expo/config-types';
import plist from '@expo/plist';
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { XcodeProject } from 'xcode';

import { ConfigPlugin, ModProps } from '../Plugin.types';
import { withInfoPlist, withXcodeProject } from '../plugins/ios-plugins';
import { InfoPlist } from './IosConfig.types';
import { getSourceRoot } from './Paths';
import { appendScheme } from './Scheme';
import { addResourceFileToGroup, getProjectName } from './utils/Xcodeproj';

export const withGoogle: ConfigPlugin = config => {
  return withInfoPlist(config, config => {
    config.modResults = setGoogleConfig(config, config.modResults, config.modRequest);
    return config;
  });
};

export const withGoogleServicesFile: ConfigPlugin = config => {
  return withXcodeProject(config, config => {
    config.modResults = setGoogleServicesFile(config, {
      projectRoot: config.modRequest.projectRoot,
      project: config.modResults,
    });
    return config;
  });
};

function readGoogleServicesInfoPlist(
  relativePath: string,
  { projectRoot }: { projectRoot: string }
) {
  const googleServiceFilePath = path.resolve(projectRoot, relativePath);
  const contents = fs.readFileSync(googleServiceFilePath, 'utf8');
  assert(contents, 'GoogleService-Info.plist is empty');
  return plist.parse(contents);
}

export function getGoogleSignInReservedClientId(
  config: Pick<ExpoConfig, 'ios'>,
  modRequest: Pick<ModProps<InfoPlist>, 'projectRoot'>
): string | null {
  const reservedClientId = config.ios?.config?.googleSignIn?.reservedClientId ?? null;
  if (reservedClientId) {
    return reservedClientId;
  }

  const googleServicesFileRelativePath = getGoogleServicesFile(config);
  if (googleServicesFileRelativePath === null) {
    return null;
  }

  const infoPlist = readGoogleServicesInfoPlist(googleServicesFileRelativePath, modRequest);

  return infoPlist.REVERSED_CLIENT_ID ?? null;
}

export function getGoogleServicesFile(config: Pick<ExpoConfig, 'ios'>) {
  return config.ios?.googleServicesFile ?? null;
}

export function setGoogleSignInReservedClientId(
  config: Pick<ExpoConfig, 'ios'>,
  infoPlist: InfoPlist,
  modRequest: Pick<ModProps<InfoPlist>, 'projectRoot'>
): InfoPlist {
  const reservedClientId = getGoogleSignInReservedClientId(config, modRequest);

  if (reservedClientId === null) {
    return infoPlist;
  }

  return appendScheme(reservedClientId, infoPlist);
}

export function setGoogleConfig(
  config: Pick<ExpoConfig, 'ios'>,
  infoPlist: InfoPlist,
  modRequest: ModProps<InfoPlist>
): InfoPlist {
  infoPlist = setGoogleSignInReservedClientId(config, infoPlist, modRequest);
  return infoPlist;
}

export function setGoogleServicesFile(
  config: Pick<ExpoConfig, 'ios'>,
  { projectRoot, project }: { project: XcodeProject; projectRoot: string }
): XcodeProject {
  const googleServicesFileRelativePath = getGoogleServicesFile(config);
  if (googleServicesFileRelativePath === null) {
    return project;
  }

  const googleServiceFilePath = path.resolve(projectRoot, googleServicesFileRelativePath);
  fs.copyFileSync(
    googleServiceFilePath,
    path.join(getSourceRoot(projectRoot), 'GoogleService-Info.plist')
  );

  const projectName = getProjectName(projectRoot);
  const plistFilePath = `${projectName}/GoogleService-Info.plist`;
  if (!project.hasFile(plistFilePath)) {
    project = addResourceFileToGroup({
      filepath: plistFilePath,
      groupName: projectName,
      project,
      isBuildFile: true,
      verbose: true,
    });
  }
  return project;
}
