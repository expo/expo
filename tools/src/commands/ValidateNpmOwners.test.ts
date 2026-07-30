import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  classifyRemovalFailure,
  groupFailuresByCategory,
  groupInvalidOwnersByPackage,
  groupPackagesByInvalidOwner,
  isNpmAuthError,
  partitionExemptPackages,
  memberNamesFromOrgMembersResponse,
  npmCredentialsHelp,
  ownerNamesFromOwnerLsOutput,
  packageNamesFromOrgPackagesResponse,
  removalFailureReason,
} from './ValidateNpmOwnersCommand';

describe('packageNamesFromOrgPackagesResponse', () => {
  it('returns the package names from a valid response', () => {
    const response = {
      'expo-camera': 'read-write',
      '@expo/config': 'read-write',
      'expo-constants': 'read-only',
    };
    assert.deepEqual(packageNamesFromOrgPackagesResponse(response), [
      'expo-camera',
      '@expo/config',
      'expo-constants',
    ]);
  });

  it('throws when the response is not an object', () => {
    assert.throws(() => packageNamesFromOrgPackagesResponse(null));
    assert.throws(() => packageNamesFromOrgPackagesResponse(['expo-camera']));
  });

  it('throws when the response contains no packages', () => {
    assert.throws(() => packageNamesFromOrgPackagesResponse({}));
  });
});

describe('memberNamesFromOrgMembersResponse', () => {
  it('returns the member names from a valid response', () => {
    const response = {
      tsapeta: 'owner',
      'expo-bot': 'developer',
    };
    assert.deepEqual(memberNamesFromOrgMembersResponse(response), ['tsapeta', 'expo-bot']);
  });

  it('throws when the response is not an object', () => {
    assert.throws(() => memberNamesFromOrgMembersResponse(null));
    assert.throws(() => memberNamesFromOrgMembersResponse('tsapeta'));
  });

  it('throws when the response contains no members', () => {
    assert.throws(() => memberNamesFromOrgMembersResponse({}));
  });
});

describe('ownerNamesFromOwnerLsOutput', () => {
  it('extracts names from "name <email>" lines', () => {
    const output = 'tsapeta <tomek@example.com>\nexpo-bot <bot@example.com>\n';
    assert.deepEqual(ownerNamesFromOwnerLsOutput(output), ['tsapeta', 'expo-bot']);
  });

  it('handles lines without an email part', () => {
    assert.deepEqual(ownerNamesFromOwnerLsOutput('tsapeta\n'), ['tsapeta']);
  });

  it('ignores blank lines', () => {
    const output = '\ntsapeta <tomek@example.com>\n\nexpo-bot <bot@example.com>\n\n';
    assert.deepEqual(ownerNamesFromOwnerLsOutput(output), ['tsapeta', 'expo-bot']);
  });

  it('returns an empty list when the package has no owners', () => {
    assert.deepEqual(ownerNamesFromOwnerLsOutput('no admin found\n'), []);
  });

  it('throws when the output contains no owners', () => {
    assert.throws(() => ownerNamesFromOwnerLsOutput(''));
    assert.throws(() => ownerNamesFromOwnerLsOutput('\n\n'));
  });
});

describe('groupPackagesByInvalidOwner', () => {
  it('groups packages by owner', () => {
    const grouped = groupPackagesByInvalidOwner({
      'expo-camera': ['ccheever'],
      'expo-font': ['ccheever'],
    });
    assert.deepEqual(grouped, [['ccheever', ['expo-camera', 'expo-font']]]);
  });

  it('sorts owners by the number of packages in descending order', () => {
    const grouped = groupPackagesByInvalidOwner({
      'expo-camera': ['ccheever', 'esamelson'],
      'expo-font': ['esamelson'],
    });
    assert.deepEqual(grouped, [
      ['esamelson', ['expo-camera', 'expo-font']],
      ['ccheever', ['expo-camera']],
    ]);
  });

  it('sorts owners with the same number of packages alphabetically', () => {
    const grouped = groupPackagesByInvalidOwner({
      'expo-camera': ['esamelson', 'ccheever'],
    });
    assert.deepEqual(grouped, [
      ['ccheever', ['expo-camera']],
      ['esamelson', ['expo-camera']],
    ]);
  });

  it('sorts packages of each owner alphabetically', () => {
    const grouped = groupPackagesByInvalidOwner({
      'expo-font': ['ccheever'],
      'expo-camera': ['ccheever'],
    });
    assert.deepEqual(grouped, [['ccheever', ['expo-camera', 'expo-font']]]);
  });

  it('returns an empty list when no packages have invalid owners', () => {
    assert.deepEqual(groupPackagesByInvalidOwner({}), []);
  });
});

describe('isNpmAuthError', () => {
  it('detects the error code in stderr', () => {
    const error = Object.assign(new Error('exited with non-zero code: 1'), {
      stderr: 'npm error code E401\nnpm error Unable to authenticate',
    });
    assert.equal(isNpmAuthError(error), true);
  });

  it('detects the error code in the JSON printed to stdout', () => {
    const error = Object.assign(new Error('exited with non-zero code: 1'), {
      stdout: '{ "error": { "code": "E401", "summary": "Unable to authenticate" } }',
    });
    assert.equal(isNpmAuthError(error), true);
  });

  it('returns false for other npm failures', () => {
    const error = Object.assign(new Error('exited with non-zero code: 1'), {
      stderr: 'npm error code E404\nnpm error 404 Not Found',
    });
    assert.equal(isNpmAuthError(error), false);
  });

  it('returns false for values that are not spawn errors', () => {
    assert.equal(isNpmAuthError(null), false);
    assert.equal(isNpmAuthError(new Error('something else')), false);
  });
});

describe('groupInvalidOwnersByPackage', () => {
  it('sorts packages by how many invalid owners they have, descending', () => {
    const grouped = groupInvalidOwnersByPackage({
      'expo-battery': ['quinlanj'],
      'expo-device': ['szdziedzic', 'jonsamp', 'quinlanj'],
      'expo-cli': ['kadikraman', 'quinlanj'],
    });
    assert.deepEqual(grouped, [
      ['expo-device', ['jonsamp', 'quinlanj', 'szdziedzic']],
      ['expo-cli', ['kadikraman', 'quinlanj']],
      ['expo-battery', ['quinlanj']],
    ]);
  });

  it('breaks ties on the package name', () => {
    const grouped = groupInvalidOwnersByPackage({
      'expo-network': ['jonsamp'],
      'expo-application': ['fiber-god'],
    });
    assert.deepEqual(grouped, [
      ['expo-application', ['fiber-god']],
      ['expo-network', ['jonsamp']],
    ]);
  });

  it('does not mutate the owner arrays it is given', () => {
    const owners = ['szdziedzic', 'jonsamp'];
    groupInvalidOwnersByPackage({ 'expo-device': owners });
    assert.deepEqual(owners, ['szdziedzic', 'jonsamp']);
  });

  it('returns an empty list when no packages have invalid owners', () => {
    assert.deepEqual(groupInvalidOwnersByPackage({}), []);
  });
});

describe('partitionExemptPackages', () => {
  it('exempts every package of a scope listed with a trailing slash', () => {
    const { validated, exempt } = partitionExemptPackages([
      'expo-camera',
      '@config-plugins/detox',
      '@config-plugins/tv',
    ]);
    assert.deepEqual(validated, ['expo-camera']);
    assert.deepEqual(exempt, ['@config-plugins/detox', '@config-plugins/tv']);
  });

  it('does not exempt a package whose name merely contains an exempt scope', () => {
    const { validated } = partitionExemptPackages(['not-@config-plugins/detox']);
    assert.deepEqual(validated, ['not-@config-plugins/detox']);
  });

  it('keeps everything when nothing matches', () => {
    const packages = ['expo-camera', '@expo/config'];
    const { validated, exempt, matched } = partitionExemptPackages(packages);
    assert.deepEqual(validated, packages);
    assert.deepEqual(exempt, []);
    assert.deepEqual(matched, []);
  });

  it('reports the reason and count of each exemption that matched', () => {
    const { matched } = partitionExemptPackages([
      'expo-camera',
      '@config-plugins/detox',
      '@config-plugins/tv',
    ]);
    assert.equal(matched.length, 1);
    assert.equal(matched[0].pattern, '@config-plugins/');
    assert.equal(matched[0].count, 2);
    assert.match(matched[0].reason, /config-plugins` npm organization/);
  });
});

describe('classifyRemovalFailure', () => {
  it('recognizes a package owned by another organization', () => {
    const category = classifyRemovalFailure(
      'code EOWNERMUTATE — Failed to update package: "404 Not Found - PUT https://registry.npmjs.org/@config-plugins%2fdetox/-rev/37 - Team not found"'
    );
    assert.equal(category?.key, 'other-org');
  });

  it('recognizes not being a maintainer of the package', () => {
    const category = classifyRemovalFailure(
      'code EOWNERMUTATE — Failed to update package: "403 Forbidden - PUT https://registry.npmjs.org/expo-firebase-app/-rev/43 - You do not have permission to publish \\"expo-firebase-app\\". Are you logged in as the correct user?"'
    );
    assert.equal(category?.key, 'not-maintainer');
  });

  it('recognizes a plain refusal, which is not the same as not being a maintainer', () => {
    const category = classifyRemovalFailure(
      'code EOWNERMUTATE — Failed to update package: "403 Forbidden - PUT https://registry.npmjs.org/uri-scheme/-rev/428 - Forbidden"'
    );
    assert.equal(category?.key, 'refused');
  });

  it('returns null for an unrecognized reason', () => {
    assert.equal(classifyRemovalFailure('code E500 — Internal Server Error'), null);
  });
});

describe('groupFailuresByCategory', () => {
  it('groups failures under their category and keeps unknown ones last', () => {
    const grouped = groupFailuresByCategory([
      { owner: 'a', packageName: 'uri-scheme', reason: '403 Forbidden - Forbidden' },
      { owner: 'a', packageName: '@config-plugins/tv', reason: '404 - Team not found' },
      { owner: 'a', packageName: 'expo-camera', reason: 'connection reset' },
      { owner: 'a', packageName: 'pod-install', reason: '403 Forbidden - Forbidden' },
    ]);

    assert.deepEqual(
      grouped.map(({ category, failures }) => [category.key, failures.map((f) => f.packageName)]),
      [
        ['other-org', ['@config-plugins/tv']],
        ['refused', ['uri-scheme', 'pod-install']],
        ['unknown', ['expo-camera']],
      ]
    );
  });

  it('returns an empty list when there are no failures', () => {
    assert.deepEqual(groupFailuresByCategory([]), []);
  });
});

describe('removalFailureReason', () => {
  it('keeps the cause that npm prints below the generic error code', () => {
    const error = Object.assign(new Error('exited with non-zero code: 1'), {
      stderr: [
        'npm error code EOWNERMUTATE',
        'npm error Failed to update package: "403 Forbidden"',
        'npm error A complete log of this run can be found in: /Users/x/.npm/_logs/debug-0.log',
      ].join('\n'),
    });
    assert.equal(
      removalFailureReason(error),
      'code EOWNERMUTATE — Failed to update package: "403 Forbidden"'
    );
  });

  it('falls back to the error message when there is no output', () => {
    assert.equal(removalFailureReason(new Error('spawn npm ENOENT')), 'spawn npm ENOENT');
  });
});

describe('npmCredentialsHelp', () => {
  it('explains that the environment variable overrides the local credentials', () => {
    const help = npmCredentialsHelp(true);
    assert.match(help, /NPM_TOKEN_READ_ONLY/);
    assert.match(help, /overrides/);
  });

  it('tells the user to log in when there is no token', () => {
    const help = npmCredentialsHelp(false);
    assert.match(help, /npm login/);
  });
});
