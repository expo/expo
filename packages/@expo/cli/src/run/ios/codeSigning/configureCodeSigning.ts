import { getEntitlementsPath } from '@expo/config-plugins/build/ios/Entitlements';
import plist from '@expo/plist';
import chalk from 'chalk';
import fs from 'fs';

import * as Log from '../../../log';
import { resolveCertificateSigningIdentityAsync } from './resolveCertificateSigningIdentity';
import * as Security from './Security';
import { getCodeSigningInfoForPbxproj, setAutoCodeSigningInfoForPbxproj } from './xcodeCodeSigning';

// These are entitlements that work on a simulator
// but still require the project to have development code signing setup.
// There may be more, but this is fine for now.
const ENTITLEMENTS_THAT_REQUIRE_CODE_SIGNING = [
  'com.apple.developer.associated-domains',
  'com.apple.developer.applesignin',
  'com.apple.developer.icloud-container-identifiers',
  'com.apple.developer.icloud-services',
  'com.apple.developer.ubiquity-kvstore-identifier',
  'com.apple.developer.ubiquity-container-identifiers',
];

function getEntitlements(projectRoot: string) {
  const entitlementsPath = getEntitlementsPath(projectRoot);
  if (!entitlementsPath || !fs.existsSync(entitlementsPath)) {
    return null;
  }

  const entitlementsContents = fs.readFileSync(entitlementsPath, 'utf8');
  const entitlements = plist.parse(entitlementsContents);
  return entitlements;
}

export function simulatorBuildRequiresCodeSigning(projectRoot: string): boolean {
  const entitlements = getEntitlements(projectRoot);
  if (!entitlements) {
    return false;
  }
  return ENTITLEMENTS_THAT_REQUIRE_CODE_SIGNING.some((entitlement) => entitlement in entitlements);
}

export async function ensureDeviceIsCodeSignedForDeploymentAsync(
  projectRoot: string
): Promise<string | null> {
  if (isCodeSigningConfigured(projectRoot)) {
    return null;
  }
  return configureCodeSigningAsync(projectRoot);
}

function isCodeSigningConfigured(projectRoot: string): boolean {
  // Check if the app already has a development team defined.
  const signingInfo = getCodeSigningInfoForPbxproj(projectRoot);

  const allTargetsHaveTeams = Object.values(signingInfo).reduce((prev, curr) => {
    return prev && !!curr.developmentTeams.length;
  }, true);

  if (allTargetsHaveTeams) {
    const teamList = Object.values(signingInfo).reduce<string[]>((prev, curr) => {
      return prev.concat([curr.developmentTeams[0]]);
    }, []);
    Log.log(chalk.dim`\u203A Auto signing app using team(s): ${teamList.join(', ')}`);
    return true;
  }

  const allTargetsHaveProfiles = Object.values(signingInfo).reduce((prev, curr) => {
    return prev && !!curr.provisioningProfiles.length;
  }, true);

  if (allTargetsHaveProfiles) {
    // this indicates that the user has manual code signing setup (possibly for production).
    return true;
  }
  return false;
}

async function configureCodeSigningAsync(projectRoot: string) {
  const ids = await Security.findIdentitiesAsync();

  const id = await resolveCertificateSigningIdentityAsync(ids);

  Log.log(`\u203A Signing and building iOS app with: ${id.codeSigningInfo}`);

  setAutoCodeSigningInfoForPbxproj(projectRoot, {
    appleTeamId: id.appleTeamId!,
  });
  return id.appleTeamId!;
}
