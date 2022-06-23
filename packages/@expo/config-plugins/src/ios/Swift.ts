import fs from 'fs';
import path from 'path';

import { ConfigPlugin, XcodeProject } from '../Plugin.types';
import { withXcodeProject } from '../plugins/ios-plugins';
import { getAppDelegate, getSourceRoot } from './Paths';
import { withBuildSourceFile } from './XcodeProjectFile';
import { addResourceFileToGroup, getProjectName } from './utils/Xcodeproj';

const templateBridgingHeader = `//
//  Use this file to import your target's public headers that you would like to expose to Swift.
//
`;

/**
 * Ensure a Swift bridging header is created for the project.
 * This helps fix problems related to using modules that are written in Swift (lottie, FBSDK).
 *
 * 1. Ensures the file exists given the project path.
 * 2. Writes the file and links to Xcode as a resource file.
 * 3. Sets the build configuration `SWIFT_OBJC_BRIDGING_HEADER = [PROJECT_NAME]-Bridging-Header.h`
 */
export const withSwiftBridgingHeader: ConfigPlugin = config => {
  return withXcodeProject(config, config => {
    config.modResults = ensureSwiftBridgingHeaderSetup({
      project: config.modResults,
      projectRoot: config.modRequest.projectRoot,
    });
    return config;
  });
};

export function ensureSwiftBridgingHeaderSetup({
  projectRoot,
  project,
}: {
  projectRoot: string;
  project: XcodeProject;
}) {
  // Only create a bridging header if using objective-c
  if (shouldCreateSwiftBridgingHeader({ projectRoot, project })) {
    const projectName = getProjectName(projectRoot);
    const bridgingHeader = createBridgingHeaderFileName(projectName);
    // Ensure a bridging header is created in the Xcode project.
    project = createBridgingHeaderFile({
      project,
      projectName,
      projectRoot,
      bridgingHeader,
    });
    // Designate the newly created file as the Swift bridging header in the Xcode project.
    project = linkBridgingHeaderFile({
      project,
      bridgingHeader: path.join(projectName, bridgingHeader),
    });
  }
  return project;
}

function shouldCreateSwiftBridgingHeader({
  projectRoot,
  project,
}: {
  projectRoot: string;
  project: XcodeProject;
}): boolean {
  // Only create a bridging header if the project is using in Objective C (AppDelegate is written in Objc).
  const isObjc = getAppDelegate(projectRoot).language === 'objc';
  return isObjc && !getDesignatedSwiftBridgingHeaderFileReference({ project });
}

/**
 * @returns String matching the default name used when Xcode automatically creates a bridging header file.
 */
function createBridgingHeaderFileName(projectName: string): string {
  return `${projectName}-Bridging-Header.h`;
}

export function getDesignatedSwiftBridgingHeaderFileReference({
  project,
}: {
  project: XcodeProject;
}): string | null {
  const configurations = project.pbxXCBuildConfigurationSection();
  // @ts-ignore
  for (const { buildSettings } of Object.values(configurations || {})) {
    // Guessing that this is the best way to emulate Xcode.
    // Using `project.addToBuildSettings` modifies too many targets.
    if (typeof buildSettings?.PRODUCT_NAME !== 'undefined') {
      if (
        typeof buildSettings.SWIFT_OBJC_BRIDGING_HEADER === 'string' &&
        buildSettings.SWIFT_OBJC_BRIDGING_HEADER
      ) {
        return buildSettings.SWIFT_OBJC_BRIDGING_HEADER;
      }
    }
  }
  return null;
}

/**
 *
 * @param bridgingHeader The bridging header filename ex: `ExpoAPIs-Bridging-Header.h`
 * @returns
 */
export function linkBridgingHeaderFile({
  project,
  bridgingHeader,
}: {
  project: XcodeProject;
  bridgingHeader: string;
}): XcodeProject {
  const configurations = project.pbxXCBuildConfigurationSection();
  // @ts-ignore
  for (const { buildSettings } of Object.values(configurations || {})) {
    // Guessing that this is the best way to emulate Xcode.
    // Using `project.addToBuildSettings` modifies too many targets.
    if (typeof buildSettings?.PRODUCT_NAME !== 'undefined') {
      buildSettings.SWIFT_OBJC_BRIDGING_HEADER = bridgingHeader;
    }
  }

  return project;
}

export function createBridgingHeaderFile({
  projectRoot,
  projectName,
  project,
  bridgingHeader,
}: {
  project: XcodeProject;
  projectName: string;
  projectRoot: string;
  bridgingHeader: string;
}): XcodeProject {
  const bridgingHeaderProjectPath = path.join(getSourceRoot(projectRoot), bridgingHeader);
  if (!fs.existsSync(bridgingHeaderProjectPath)) {
    // Create the file
    fs.writeFileSync(bridgingHeaderProjectPath, templateBridgingHeader, 'utf8');
  }

  // This is non-standard, Xcode generates the bridging header in `/ios` which is kinda annoying.
  // Instead, this'll generate the default header in the application code folder `/ios/myproject/`.
  const filePath = `${projectName}/${bridgingHeader}`;
  // Ensure the file is linked with Xcode resource files
  if (!project.hasFile(filePath)) {
    project = addResourceFileToGroup({
      filepath: filePath,
      groupName: projectName,
      project,
      // Not sure why, but this is how Xcode generates it.
      isBuildFile: false,
      verbose: false,
    });
  }
  return project;
}

export const withNoopSwiftFile: ConfigPlugin = config => {
  return withBuildSourceFile(config, {
    filePath: 'noop-file.swift',
    contents: [
      '//',
      '// @generated',
      '// A blank Swift file must be created for native modules with Swift files to work correctly.',
      '//',
      '',
    ].join('\n'),
  });
};
