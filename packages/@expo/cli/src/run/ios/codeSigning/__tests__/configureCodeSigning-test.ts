import { ensureDeviceIsCodeSignedForDeploymentAsync } from '../configureCodeSigning';
import { resolveCertificateSigningIdentityAsync } from '../resolveCertificateSigningIdentity';
import {
  type CodeSigningInfo,
  getCodeSigningInfoForPbxproj,
  setAutoCodeSigningInfoForPbxproj,
} from '../xcodeCodeSigning';

jest.mock('../../../../log');
jest.mock('../Security', () => ({
  findIdentitiesAsync: jest.fn(async () => []),
}));
jest.mock('../resolveCertificateSigningIdentity', () => ({
  resolveCertificateSigningIdentityAsync: jest.fn(async () => ({
    appleTeamId: 'NEWTEAM123',
    codeSigningInfo: 'Apple Development: Expo (NEWTEAM123)',
  })),
}));
jest.mock('../xcodeCodeSigning', () => ({
  getCodeSigningInfoForPbxproj: jest.fn(),
  setAutoCodeSigningInfoForPbxproj: jest.fn(),
}));

function target(signing: Partial<CodeSigningInfo[string]>): CodeSigningInfo[string] {
  return {
    developmentTeams: [],
    provisioningProfiles: [],
    configurations: ['Debug', 'Release'],
    manualSigningConfigurations: [],
    ...signing,
  };
}

describe(ensureDeviceIsCodeSignedForDeploymentAsync, () => {
  const projectRoot = '/app';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each<[string, CodeSigningInfo, string | undefined]>([
    ['a team and automatic signing', { app: target({ developmentTeams: ['TEAM123'] }) }, 'Debug'],
    [
      'manual signing only in another configuration',
      {
        app: target({
          developmentTeams: ['TEAM123'],
          provisioningProfiles: ['"match AppStore com.example"'],
          manualSigningConfigurations: ['Release'],
        }),
      },
      'Debug',
    ],
  ])(`allows provisioning updates for a project with %s`, async (_, signingInfo, configuration) => {
    jest.mocked(getCodeSigningInfoForPbxproj).mockReturnValueOnce(signingInfo);

    await expect(
      ensureDeviceIsCodeSignedForDeploymentAsync(projectRoot, configuration)
    ).resolves.toEqual({
      developmentTeamId: null,
      allowProvisioningUpdates: true,
    });
    expect(resolveCertificateSigningIdentityAsync).not.toHaveBeenCalled();
    expect(setAutoCodeSigningInfoForPbxproj).not.toHaveBeenCalled();
  });

  it.each<[string, CodeSigningInfo, string | undefined]>([
    [
      'manual signing in the built configuration',
      {
        app: target({
          developmentTeams: ['TEAM123'],
          provisioningProfiles: ['"match Development com.example"'],
          manualSigningConfigurations: ['Debug'],
        }),
      },
      'Debug',
    ],
    [
      'an extension using manual signing',
      {
        app: target({ developmentTeams: ['TEAM123'] }),
        extension: target({
          developmentTeams: ['TEAM123'],
          manualSigningConfigurations: ['Debug', 'Release'],
        }),
      },
      'Debug',
    ],
    [
      'manual signing and an unknown configuration',
      {
        app: target({
          developmentTeams: ['TEAM123'],
          manualSigningConfigurations: ['Release'],
        }),
      },
      'Staging',
    ],
    [
      'provisioning profiles without a team',
      {
        app: target({
          provisioningProfiles: ['"match Development com.example"'],
          manualSigningConfigurations: ['Debug', 'Release'],
        }),
      },
      'Debug',
    ],
  ])(
    `does not allow provisioning updates for a project with %s`,
    async (_, signingInfo, configuration) => {
      jest.mocked(getCodeSigningInfoForPbxproj).mockReturnValueOnce(signingInfo);

      await expect(
        ensureDeviceIsCodeSignedForDeploymentAsync(projectRoot, configuration)
      ).resolves.toEqual({
        developmentTeamId: null,
        allowProvisioningUpdates: false,
      });
      expect(resolveCertificateSigningIdentityAsync).not.toHaveBeenCalled();
      expect(setAutoCodeSigningInfoForPbxproj).not.toHaveBeenCalled();
    }
  );

  it(`configures automatic code signing when a target has no team or profile`, async () => {
    jest.mocked(getCodeSigningInfoForPbxproj).mockReturnValueOnce({
      app: target({ developmentTeams: ['TEAM123'] }),
      extension: target({}),
    });

    await expect(ensureDeviceIsCodeSignedForDeploymentAsync(projectRoot, 'Debug')).resolves.toEqual(
      {
        developmentTeamId: 'NEWTEAM123',
        allowProvisioningUpdates: true,
      }
    );
    expect(setAutoCodeSigningInfoForPbxproj).toHaveBeenCalledWith(projectRoot, {
      appleTeamId: 'NEWTEAM123',
    });
  });
});
