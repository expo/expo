import { getConfig, modifyConfigAsync } from '@expo/config';
import chalk from 'chalk';

import * as Security from './Security';
import { getLastDeveloperCodeSigningIdAsync, setLastDeveloperCodeSigningIdAsync } from './settings';
import * as Log from '../../../log';
import { CommandError } from '../../../utils/errors';
import { isInteractive } from '../../../utils/interactive';
import { learnMore } from '../../../utils/link';
import { selectAsync } from '../../../utils/prompts';

/**
 * Sort the code signing items so the last selected item (user's default) is the first suggested.
 */
export async function sortDefaultIdToBeginningAsync(
  identities: Security.CertificateSigningInfo[]
): Promise<[Security.CertificateSigningInfo[], string | null]> {
  const lastSelected = await getLastDeveloperCodeSigningIdAsync();

  if (lastSelected) {
    let iterations = 0;
    while (identities[0].signingCertificateId !== lastSelected && iterations < identities.length) {
      identities.push(identities.shift()!);
      iterations++;
    }
  }
  return [identities, lastSelected];
}

/**
 * Assert that the computer needs code signing setup.
 * This links to an FYI page that was user tested internally.
 */
function assertCodeSigningSetup(): never {
  // TODO: We can probably do this too automatically.
  Log.log(
    `\u203A Your computer requires some additional setup before you can build onto physical iOS devices.\n  ${chalk.bold(
      learnMore('https://expo.fyi/setup-xcode-signing')
    )}`
  );

  throw new CommandError('No code signing certificates are available to use.');
}

/**
 * Resolve the best certificate signing identity from a given list of IDs.
 * - If no IDs: Assert that the user has to setup code signing.
 * - If one ID: Return the first ID.
 * - If multiple IDs: Ask the user to select one, then store the value to be suggested first next time (since users generally use the same ID).
 */
export async function resolveCertificateSigningIdentityAsync(
  projectRoot: string,
  ids: string[]
): Promise<Security.CertificateSigningInfo> {
  // The user has no valid code signing identities.
  if (!ids.length) {
    assertCodeSigningSetup();
  }

  //  One ID available 🤝 Program is not interactive
  //
  //     using the the first available option
  if (ids.length === 1 || !isInteractive()) {
    // This method is cheaper than `resolveIdentitiesAsync` and checking the
    // cached user preference so we should use this as early as possible.
    return Security.resolveCertificateSigningInfoAsync(ids[0]);
  }

  // Get identities and sort by the one that the user is most likely to choose.
  const [identities, preferred] = await sortDefaultIdToBeginningAsync(
    await Security.resolveIdentitiesAsync(ids)
  );

  // Read the config to interact with the `ios.appleTeamId` property
  const { exp } = getConfig(projectRoot, {
    // We don't need very many fields here, just use the lightest possible read.
    skipSDKVersionRequirement: true,
    skipPlugins: true,
  });
  const configuredTeamId = exp.ios?.appleTeamId;

  const configuredIdentity = configuredTeamId
    ? identities.find((identity) => identity.appleTeamId === configuredTeamId)
    : undefined;

  const selectedIdentity =
    configuredIdentity ?? (await selectDevelopmentTeamAsync(identities, preferred));

  await Promise.all([
    // Store the last used value and suggest it as the first value
    // next time the user has to select a code signing identity.
    setLastDeveloperCodeSigningIdAsync(selectedIdentity.signingCertificateId),
    // Store the last used team id in the app manifest, when no team id has been configured yet
    configuredTeamId || !selectedIdentity.appleTeamId
      ? Promise.resolve()
      : modifyConfigAsync(projectRoot, { ios: { appleTeamId: selectedIdentity.appleTeamId } }),
  ]);

  return selectedIdentity;
}

/** Prompt the user to select a development team, highlighting the preferred value based on the user history. */
export async function selectDevelopmentTeamAsync(
  identities: Security.CertificateSigningInfo[],
  preferredId: string | null
): Promise<Security.CertificateSigningInfo> {
  const index = await selectAsync(
    'Development team for signing the app',
    identities.map((value, i) => {
      const format =
        value.signingCertificateId === preferredId ? chalk.bold : (message: string) => message;
      return {
        // Formatted like: `650 Industries, Inc. (A1BCDEF234) - Apple Development: Evan Bacon (AA00AABB0A)`
        title: format(
          [value.appleTeamName, `(${value.appleTeamId}) -`, value.codeSigningInfo].join(' ')
        ),
        value: i,
      };
    })
  );

  return identities[index];
}
