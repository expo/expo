import type { ExpoConfig } from '@expo/config-types';
import type { JSONObject } from '@expo/json-file';
import fs from 'fs';
import path from 'path';
import type { XCBuildConfiguration, XcodeProject } from 'xcode';

import { createEntitlementsPlugin } from '../plugins/ios-plugins';
import { findFirstNativeTarget, getXCBuildConfigurationFromPbxproj } from './Target';
import {
  getBuildConfigurationsForListId,
  getPbxproj,
  getProductName,
  getProjectName,
} from './utils/Xcodeproj';
import { trimQuotes } from './utils/string';

export const withAssociatedDomains = createEntitlementsPlugin(
  setAssociatedDomains,
  'withAssociatedDomains'
);

export function setAssociatedDomains(
  config: ExpoConfig,
  { 'com.apple.developer.associated-domains': _, ...entitlementsPlist }: JSONObject
): JSONObject {
  if (config.ios?.associatedDomains) {
    return {
      ...entitlementsPlist,
      'com.apple.developer.associated-domains': config.ios.associatedDomains,
    };
  }

  return entitlementsPlist;
}

export function getEntitlementsPath(
  projectRoot: string,
  {
    targetName,
    buildConfiguration = 'Release',
  }: { targetName?: string; buildConfiguration?: string } = {}
): string | null {
  const project = getPbxproj(projectRoot);
  const xcBuildConfiguration = getXCBuildConfigurationFromPbxproj(project, {
    targetName,
    buildConfiguration,
  });
  if (!xcBuildConfiguration) {
    return null;
  }
  const entitlementsPath = getEntitlementsPathFromBuildConfiguration(
    getPlatformProjectRoot(project),
    xcBuildConfiguration
  );
  return entitlementsPath && fs.existsSync(entitlementsPath) ? entitlementsPath : null;
}

/**
 * `CODE_SIGN_ENTITLEMENTS` is relative to the directory holding the `.xcodeproj`, which is
 * `<projectRoot>/ios` for an iOS project and `<projectRoot>/tvos` for a tvOS one.
 */
function getPlatformProjectRoot(project: XcodeProject): string {
  return path.dirname(path.dirname(project.filepath));
}

function getEntitlementsPathFromBuildConfiguration(
  platformProjectRoot: string,
  xcBuildConfiguration: XCBuildConfiguration
): string | null {
  const entitlementsPathRaw = xcBuildConfiguration?.buildSettings?.CODE_SIGN_ENTITLEMENTS as
    | string
    | undefined;
  if (entitlementsPathRaw) {
    return path.normalize(path.join(platformProjectRoot, trimQuotes(entitlementsPathRaw)));
  } else {
    return null;
  }
}

export function ensureApplicationTargetEntitlementsFileConfigured(projectRoot: string): void {
  const project = getPbxproj(projectRoot);
  const projectName = getProjectName(projectRoot);
  const productName = getProductName(project);
  const platformProjectRoot = getPlatformProjectRoot(project);

  const [, applicationTarget] = findFirstNativeTarget(project);
  const buildConfigurations = getBuildConfigurationsForListId(
    project,
    applicationTarget.buildConfigurationList
  );
  let hasChangesToWrite = false;
  for (const [, xcBuildConfiguration] of buildConfigurations) {
    const oldEntitlementPath = getEntitlementsPathFromBuildConfiguration(
      platformProjectRoot,
      xcBuildConfiguration
    );
    if (oldEntitlementPath && fs.existsSync(oldEntitlementPath)) {
      return;
    }
    hasChangesToWrite = true;
    // Use posix formatted path, even on Windows
    const entitlementsRelativePath = path
      .join(projectName, `${productName}.entitlements`)
      .replace(/\\/g, '/');
    const entitlementsPath = path.resolve(platformProjectRoot, entitlementsRelativePath);
    fs.mkdirSync(path.dirname(entitlementsPath), { recursive: true });
    if (!fs.existsSync(entitlementsPath)) {
      fs.writeFileSync(entitlementsPath, ENTITLEMENTS_TEMPLATE);
    }
    xcBuildConfiguration.buildSettings.CODE_SIGN_ENTITLEMENTS = entitlementsRelativePath;
  }
  if (hasChangesToWrite) {
    fs.writeFileSync(project.filepath, project.writeSync());
  }
}

const ENTITLEMENTS_TEMPLATE = `
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
</dict>
</plist>
`;
