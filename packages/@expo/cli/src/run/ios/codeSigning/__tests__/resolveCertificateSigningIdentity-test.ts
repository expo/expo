import { getConfig, modifyConfigAsync } from '@expo/config';
import chalk from 'chalk';

import * as Log from '../../../../log';
import { selectAsync } from '../../../../utils/prompts';
import * as Security from '../Security';
import {
  resolveCertificateSigningIdentityAsync,
  selectDevelopmentTeamAsync,
} from '../resolveCertificateSigningIdentity';
import * as Settings from '../settings';

jest.mock('@expo/config');
jest.mock('../../../../log');
jest.mock('../../../../utils/prompts');

jest.mock('../../../../utils/interactive', () => ({
  isInteractive: jest.fn(() => true),
}));

jest.mock('../settings', () => ({
  getLastDeveloperCodeSigningIdAsync: jest.fn(),
  setLastDeveloperCodeSigningIdAsync: jest.fn(),
}));

jest.mock('../Security', () => ({
  resolveCertificateSigningInfoAsync: jest.fn(),
  resolveIdentitiesAsync: jest.fn(),
}));

const projectRoot = '/test';

describe(selectDevelopmentTeamAsync, () => {
  it(`formats prompt`, async () => {
    const identities = [
      {
        developmentTeams: [],
        signingCertificateId: 'XXX',
        codeSigningInfo: 'Apple Development: Evan Bacon (XXX)',
        appleTeamName: '650 Industries, Inc.',
        appleTeamId: 'A1BCDEF234',
      },
      {
        developmentTeams: [],
        signingCertificateId: 'YYY',
        codeSigningInfo: 'Apple Developer: Nave Nocab (YYY)',
        appleTeamId: '12345ABCD',
      },
    ];
    const preferredId = 'A1BCDEF234';
    await selectDevelopmentTeamAsync(identities, preferredId);

    expect(selectAsync).toBeCalledWith('Development team for signing the app', [
      {
        title: '650 Industries, Inc. (A1BCDEF234) - Apple Development: Evan Bacon (XXX)',
        value: 0,
      },
      { title: ' (12345ABCD) - Apple Developer: Nave Nocab (YYY)', value: 1 },
    ]);
  });
});

describe(resolveCertificateSigningIdentityAsync, () => {
  it(`asserts when no IDs are provided`, async () => {
    const ids = [];
    await expect(resolveCertificateSigningIdentityAsync(projectRoot, ids)).rejects.toThrow(
      'No code signing certificates are available to use.'
    );
    expect(Log.log).toHaveBeenCalledWith(
      expect.stringMatching(/Your computer requires some additional setup/)
    );
  });

  it(`auto selects the first ID when there is only one`, async () => {
    jest.mocked(getConfig).mockReturnValue({ exp: { name: 'test', slug: 'test' } } as any);

    jest.mocked(Security.resolveCertificateSigningInfoAsync).mockResolvedValue({
      signingCertificateId: 'XXX',
    });

    await expect(resolveCertificateSigningIdentityAsync(projectRoot, ['YYY'])).resolves.toEqual({
      signingCertificateId: 'XXX',
    });

    // Ensure that we only store the value when the user manually selects it.
    expect(Settings.setLastDeveloperCodeSigningIdAsync).not.toHaveBeenCalled();
  });

  it(`prompts when there are more than one signing identities`, async () => {
    jest.mocked(getConfig).mockReturnValue({ exp: { name: 'test', slug: 'test' } } as any);

    jest.mocked(Settings.getLastDeveloperCodeSigningIdAsync).mockResolvedValue('YYY');
    jest.mocked(Security.resolveIdentitiesAsync).mockResolvedValueOnce([
      {
        signingCertificateId: 'XXX',
        codeSigningInfo: 'Apple Development: Evan Bacon (XXX)',
        appleTeamName: '650 Industries, Inc.',
        appleTeamId: 'A1BCDEF234',
      },
      {
        signingCertificateId: 'YYY',
        codeSigningInfo: 'Apple Developer: Nave Nocab (YYY)',
        appleTeamId: '12345ABCD',
      },
    ]);

    jest.mocked(selectAsync).mockResolvedValueOnce(0);

    await expect(
      resolveCertificateSigningIdentityAsync(projectRoot, ['YYY', 'XXX'])
    ).resolves.toEqual({
      appleTeamId: expect.any(String),
      codeSigningInfo: expect.any(String),
      signingCertificateId: 'YYY',
    });

    expect(selectAsync).toHaveBeenCalledWith(expect.any(String), [
      {
        // Formatted the preferred ID as bold and sorted it first.
        title: chalk.bold(' (12345ABCD) - Apple Developer: Nave Nocab (YYY)'),
        value: 0,
      },
      expect.anything(),
    ]);

    // Store the preferred ID for the next time.
    expect(Settings.setLastDeveloperCodeSigningIdAsync).toBeCalledWith('YYY');
  });

  it(`stores the apple team id in app manifest when prompted`, async () => {
    jest.mocked(getConfig).mockReturnValue({ exp: { name: 'test', slug: 'test' } } as any);

    jest.mocked(Settings.getLastDeveloperCodeSigningIdAsync).mockResolvedValue('YYY');
    jest.mocked(Security.resolveIdentitiesAsync).mockResolvedValueOnce([
      {
        signingCertificateId: 'XXX',
        codeSigningInfo: 'Apple Development: Evan Bacon (XXX)',
        appleTeamName: '650 Industries, Inc.',
        appleTeamId: 'A1BCDEF234',
      },
      {
        signingCertificateId: 'YYY',
        codeSigningInfo: 'Apple Developer: Nave Nocab (YYY)',
        appleTeamId: '12345ABCD',
      },
    ]);

    jest.mocked(selectAsync).mockResolvedValueOnce(0);

    await expect(
      resolveCertificateSigningIdentityAsync(projectRoot, ['YYY', 'XXX'])
    ).resolves.toEqual({
      appleTeamId: expect.any(String),
      codeSigningInfo: expect.any(String),
      signingCertificateId: 'YYY',
    });

    // Store the team ID in the app manifest for the next time.
    expect(modifyConfigAsync).toHaveBeenCalledWith(
      projectRoot,
      expect.objectContaining({ ios: { appleTeamId: '12345ABCD' } })
    );
  });

  it(`does not prompt when app manifest has team id configured`, async () => {
    const ios = { appleTeamId: '12345ABCD' };
    jest.mocked(getConfig).mockReturnValue({ exp: { name: 'test', slug: 'test', ios } } as any);

    jest.mocked(Settings.getLastDeveloperCodeSigningIdAsync).mockResolvedValue('YYY');
    jest.mocked(Security.resolveIdentitiesAsync).mockResolvedValueOnce([
      {
        signingCertificateId: 'XXX',
        codeSigningInfo: 'Apple Development: Evan Bacon (XXX)',
        appleTeamName: '650 Industries, Inc.',
        appleTeamId: 'A1BCDEF234',
      },
      {
        signingCertificateId: 'YYY',
        codeSigningInfo: 'Apple Developer: Nave Nocab (YYY)',
        appleTeamId: '12345ABCD',
      },
    ]);

    jest.mocked(selectAsync).mockResolvedValueOnce(0);

    await expect(
      resolveCertificateSigningIdentityAsync(projectRoot, ['YYY', 'XXX'])
    ).resolves.toEqual({
      appleTeamId: expect.any(String),
      codeSigningInfo: expect.any(String),
      signingCertificateId: 'YYY',
    });

    expect(selectAsync).not.toHaveBeenCalled();
  });
});
