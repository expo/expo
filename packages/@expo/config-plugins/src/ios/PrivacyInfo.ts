import { ExpoConfig } from '@expo/config-types';
import plist from '@expo/plist';
import fs from 'fs';
import path from 'path';
import type { XcodeProject } from 'xcode';

import { ExportedConfigWithProps } from '../Plugin.types';
import { addResourceFileToGroup, getProjectName } from './utils/Xcodeproj';
import { withXcodeProject } from '../plugins/ios-plugins';

export type PrivacyInfo = {
  NSPrivacyAccessedAPITypes: {
    NSPrivacyAccessedAPIType: string;
    NSPrivacyAccessedAPITypeReasons: string[];
  }[];
  NSPrivacyCollectedDataTypes: {
    NSPrivacyCollectedDataType: string;
    NSPrivacyCollectedDataTypeLinked: boolean;
    NSPrivacyCollectedDataTypeTracking: boolean;
    NSPrivacyCollectedDataTypePurposes: string[];
  }[];
  NSPrivacyTracking: boolean;
  NSPrivacyTrackingDomains: string[];
};

export function withPrivacyInfo(config: ExpoConfig): ExpoConfig {
  const privacyManifests = config.ios?.privacyManifests;
  if (!privacyManifests) {
    return config;
  }

  return withXcodeProject(config, (projectConfig: ExportedConfigWithProps<XcodeProject>) => {
    return setPrivacyInfo(projectConfig, privacyManifests);
  });
}

export function setPrivacyInfo(
  projectConfig: ExportedConfigWithProps<XcodeProject>,
  privacyManifests: Partial<PrivacyInfo>
) {
  const { projectRoot, platformProjectRoot } = projectConfig.modRequest;

  const projectName = getProjectName(projectRoot);

  const privacyFilePath = path.join(platformProjectRoot, projectName, 'PrivacyInfo.xcprivacy');

  const existingFileContent = getFileContents(privacyFilePath);

  const parsedContent = existingFileContent ? plist.parse(existingFileContent) : {};
  const mergedContent = mergePrivacyInfo(parsedContent, privacyManifests);
  const contents = plist.build(mergedContent);

  ensureFileExists(privacyFilePath, contents);

  if (!projectConfig.modResults.hasFile(privacyFilePath)) {
    projectConfig.modResults = addResourceFileToGroup({
      filepath: path.join(projectName, 'PrivacyInfo.xcprivacy'),
      groupName: projectName,
      project: projectConfig.modResults,
      isBuildFile: true,
      verbose: true,
    });
  }

  return projectConfig;
}

function getFileContents(filePath: string): string | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return fs.readFileSync(filePath, { encoding: 'utf8' });
}

function ensureFileExists(filePath: string, contents: string) {
  if (!fs.existsSync(path.dirname(filePath))) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  }
  fs.writeFileSync(filePath, contents);
}

export function mergePrivacyInfo(
  existing: Partial<PrivacyInfo>,
  privacyManifests: Partial<PrivacyInfo>
): PrivacyInfo {
  let {
    NSPrivacyAccessedAPITypes = [],
    NSPrivacyCollectedDataTypes = [],
    NSPrivacyTracking = false,
    NSPrivacyTrackingDomains = [],
  } = structuredClone(existing);
  // tracking is a boolean, so we can just overwrite it
  NSPrivacyTracking = privacyManifests.NSPrivacyTracking ?? existing.NSPrivacyTracking ?? false;
  // merge the api types – for each type ensure the key is in the array, and if it is add the reason if it's not there
  privacyManifests.NSPrivacyAccessedAPITypes?.forEach((newType) => {
    const existingType = NSPrivacyAccessedAPITypes.find(
      (t) => t.NSPrivacyAccessedAPIType === newType.NSPrivacyAccessedAPIType
    );
    if (!existingType) {
      NSPrivacyAccessedAPITypes.push(newType);
    } else {
      existingType.NSPrivacyAccessedAPITypeReasons = [
        ...new Set(
          existingType?.NSPrivacyAccessedAPITypeReasons?.concat(
            ...newType.NSPrivacyAccessedAPITypeReasons
          )
        ),
      ];
    }
  });
  // merge the collected data types – for each type ensure the key is in the array, and if it is add the purposes if it's not there
  privacyManifests.NSPrivacyCollectedDataTypes?.forEach((newType) => {
    const existingType = NSPrivacyCollectedDataTypes.find(
      (t) => t.NSPrivacyCollectedDataType === newType.NSPrivacyCollectedDataType
    );
    if (!existingType) {
      NSPrivacyCollectedDataTypes.push(newType);
    } else {
      existingType.NSPrivacyCollectedDataTypePurposes = [
        ...new Set(
          existingType?.NSPrivacyCollectedDataTypePurposes?.concat(
            ...newType.NSPrivacyCollectedDataTypePurposes
          )
        ),
      ];
    }
  });
  // merge the tracking domains
  NSPrivacyTrackingDomains = [
    ...new Set(NSPrivacyTrackingDomains.concat(privacyManifests.NSPrivacyTrackingDomains ?? [])),
  ];

  return {
    NSPrivacyAccessedAPITypes,
    NSPrivacyCollectedDataTypes,
    NSPrivacyTracking,
    NSPrivacyTrackingDomains,
  };
}
