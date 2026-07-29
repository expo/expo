import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  groupPackagesByInvalidOwner,
  memberNamesFromOrgMembersResponse,
  ownerNamesFromOwnerLsOutput,
  packageNamesFromOrgPackagesResponse,
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
