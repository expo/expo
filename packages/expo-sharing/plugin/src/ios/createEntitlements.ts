import plist from '@expo/plist';
import fs from 'fs';
import path from 'path';

const SECURITY_GROUPS_KEY = 'com.apple.security.application-groups';
export type ShareIntoEntitlements = Record<string, string[]>;

export function createEntitlements(appGroupId: string): ShareIntoEntitlements {
  const buildObject: ShareIntoEntitlements = {};
  buildObject[SECURITY_GROUPS_KEY] = [appGroupId];
  return buildObject;
}

export function createEntitlementsFile(
  targetDirectory: string,
  extensionTargetName: string,
  appGroupId: string
) {
  const entitlementsPath = path.join(targetDirectory, `/${extensionTargetName}.entitlements`);
  const entitlementsObject = createEntitlements(appGroupId);
  const builtPlist = plist.build(entitlementsObject);

  return fs.writeFileSync(entitlementsPath, builtPlist);
}
