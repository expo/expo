import chalk from 'chalk';

import * as Security from './Security';
import { resolveCertificateSigningIdentityAsync } from './resolveCertificateSigningIdentity';
import { getCodeSigningInfoForPbxproj, setAutoCodeSigningInfoForPbxproj } from './xcodeCodeSigning';
import * as Log from '../../../log';

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
