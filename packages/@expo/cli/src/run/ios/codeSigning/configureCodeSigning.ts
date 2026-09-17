import chalk from 'chalk';

import * as Log from '../../../log';
import * as Security from './Security';
import { resolveCertificateSigningIdentityAsync } from './resolveCertificateSigningIdentity';
import {
  type CodeSigningInfo,
  getCodeSigningInfoForPbxproj,
  setAutoCodeSigningInfoForPbxproj,
} from './xcodeCodeSigning';

export type DeviceCodeSigningResult = {
  developmentTeamId: string | null;
  allowProvisioningUpdates: boolean;
};

export async function ensureDeviceIsCodeSignedForDeploymentAsync(
  projectRoot: string,
  configuration?: string
): Promise<DeviceCodeSigningResult> {
  const signingInfo = getCodeSigningInfoForPbxproj(projectRoot);
  const configuredSigning = getConfiguredCodeSigningStyle(signingInfo, configuration);
  if (configuredSigning === 'automatic') {
    return { developmentTeamId: null, allowProvisioningUpdates: true };
  }
  if (configuredSigning === 'manual') {
    return { developmentTeamId: null, allowProvisioningUpdates: false };
  }
  const developmentTeamId = await configureCodeSigningAsync(projectRoot);
  return { developmentTeamId, allowProvisioningUpdates: true };
}

function usesManualSigning(target: CodeSigningInfo[string], configuration?: string): boolean {
  if (configuration && target.configurations.includes(configuration)) {
    return target.manualSigningConfigurations.includes(configuration);
  }
  return !!target.manualSigningConfigurations.length;
}

function getConfiguredCodeSigningStyle(
  signingInfo: CodeSigningInfo,
  configuration?: string
): 'automatic' | 'manual' | null {
  const targets = Object.values(signingInfo);

  const allTargetsHaveTeams = targets.every((target) => !!target.developmentTeams.length);
  if (allTargetsHaveTeams) {
    const teamList = targets.reduce<string[]>((prev, curr) => {
      const team = curr.developmentTeams[0];
      return team ? [...prev, team] : prev;
    }, []);
    if (targets.some((target) => usesManualSigning(target, configuration))) {
      return 'manual';
    }
    Log.log(chalk.dim`\u203A Auto signing app using team(s): ${teamList.join(', ')}`);
    return 'automatic';
  }

  const allTargetsHaveProfiles = targets.every((target) => !!target.provisioningProfiles.length);
  if (allTargetsHaveProfiles) {
    return 'manual';
  }
  return null;
}

async function configureCodeSigningAsync(projectRoot: string) {
  const ids = await Security.findIdentitiesAsync();

  const id = await resolveCertificateSigningIdentityAsync(projectRoot, ids);

  Log.log(`\u203A Signing and building iOS app with: ${id.codeSigningInfo}`);

  setAutoCodeSigningInfoForPbxproj(projectRoot, {
    appleTeamId: id.appleTeamId!,
  });
  return id.appleTeamId!;
}
