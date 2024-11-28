import nock from 'nock';

import { Log } from '../../log';
import { stripAnsi } from '../ansi';
import { isUrlAvailableAsync } from '../url';
import {
  getBundleIdWarningInternalAsync,
  getPackageNameWarningInternalAsync,
  validateBundleId,
  validatePackage,
  validatePackageWithWarning,
  getSanitizedBundleIdentifier,
  getSanitizedPackage,
  assertValidPackage,
} from '../validateApplicationId';

jest.mock('../url');
jest.mock('../../log');

function resetOfflineMode() {
  beforeEach(() => {
    delete process.env.EXPO_OFFLINE;
  });
  afterAll(() => {
    delete process.env.EXPO_OFFLINE;
  });
}

describe(validateBundleId, () => {
  it(`validates`, () => {
    expect(validateBundleId('bacon')).toBe(true);
    expect(validateBundleId('...b.a.-c.0.n...')).toBe(true);
    expect(validateBundleId('.')).toBe(true);
    expect(validateBundleId('. ..')).toBe(false);
    expect(validateBundleId('_')).toBe(false);
    expect(validateBundleId(',')).toBe(false);
  });
});

describe(validatePackageWithWarning, () => {
  it(`validates with warnings`, () => {
    expect(validatePackageWithWarning('bacon.native')).toEqual(
      `"native" is a reserved Java keyword.`
    );
    expect(validatePackageWithWarning('bacon')).toEqual(
      'Package name must contain more than one segment, separated by ".", e.g. com.bacon'
    );
    expect(validatePackageWithWarning(',')).toEqual(
      `Package name must contain more than one segment, separated by ".", e.g. com.,`
    );
  });
});

describe(getSanitizedBundleIdentifier, () => {
  [
    // Sanity
    ['bacon.com.hey', 'bacon.com.hey'],
    // Most likely outcome
    ['com.my-expo-username.june-34', 'com.my-expo-username.june-34'],
    // Also possible
    [
      // Dropped this string in Xcode (accounting for escape characters) and got the output string...
      '1234567890-=qwertyuiop[]\\asdfghjkl;\'zxcvbnm,./!@#$%^&*()_+`~QWERTYUIOP{}|ASDFGHJKL:"ZXCVBNM<>?',
      '-234567890--qwertyuiop---asdfghjkl--zxcvbnm-.---------------QWERTYUIOP---ASDFGHJKL--ZXCVBNM---',
    ],
    ['7', '-'],
    ['#', '-'],
    ['P', 'P'],
    ['...', '...'],
    ['native.ios', 'native.ios'],
    ['com.native', 'com.native'],
    ['a.b', 'a.b'],
  ].forEach(([input, output]) => {
    it(`sanitizes ${input} to valid "${output}"`, () => {
      const sanitized = getSanitizedBundleIdentifier(input);
      expect(sanitized).toBe(output);
      expect(validateBundleId(sanitized)).toBe(true);
    });
  });
});

describe(getSanitizedPackage, () => {
  [
    // Sanity
    ['bacon.com.hey', 'bacon.com.hey'],
    // Most likely outcome
    ['com.my-expo-username.june-34', 'com.myexpousername.june34'],

    // Also possible
    ['jun25-d..ev @la0_0.0._uncher', 'jun25d.evla0_0.x0.x_uncher'],

    ['native.android', 'xnative.android'],
    ['com.native', 'com.xnative'],
    // Appends correct number of segments
    ['a', 'com.a'],
    ['a.b', 'a.b'],
    // Ensures that each dot starts with a letter
    ['_', 'com.x_'],
    // Strips extra dots
    ['a.b...c.', 'a.b.c'],
    ['a.b_..c', 'a.b_.c'],
    // Should likely never happen given how we use the function.
    ['.', 'com.app'],
    ['.', 'com.app'],
    ['. ..', 'com.app'],
    [',', 'com.app'],
    ['...b.a.-c.0.n...', 'b.a.c.x0.n'],
  ].forEach(([input, output]) => {
    it(`sanitizes ${input} to valid "${output}"`, () => {
      const sanitized = getSanitizedPackage(input);
      expect(sanitized).toBe(output);
      assertValidPackage(sanitized);
    });
  });
});
describe(validatePackage, () => {
  it(`validates`, () => {
    expect(validatePackage('bacon.com.hey')).toBe(true);
    expect(validatePackage('bacon')).toBe(false);
    expect(validatePackage('com.native')).toBe(false);
    expect(validatePackage('native.android')).toBe(false);
    expect(validatePackage('foo.native.foo.bar')).toBe(false);
    expect(validatePackage('native.foo.bar')).toBe(false);
    expect(validatePackage('...b.a.-c.0.n...')).toBe(false);
    expect(validatePackage('.')).toBe(false);
    expect(validatePackage('. ..')).toBe(false);
    expect(validatePackage('_')).toBe(false);
    expect(validatePackage(',')).toBe(false);
  });
  it(`prevents using reserved java keywords`, () => {
    expect(validatePackage('bacon.native.com')).toBe(false);
    expect(validatePackage('byte')).toBe(false);
  });
});

describe(getBundleIdWarningInternalAsync, () => {
  resetOfflineMode();
  it(`returns null if the URL cannot be reached`, async () => {
    jest.mocked(isUrlAvailableAsync).mockResolvedValueOnce(false);
    expect(await getBundleIdWarningInternalAsync('bacon')).toBe(null);
  });
  it(`returns null and warns if running in offline-mode`, async () => {
    process.env.EXPO_OFFLINE = '1';
    await expect(getBundleIdWarningInternalAsync('bacon')).resolves.toBe(null);
    expect(Log.warn).toBeCalledWith(expect.stringMatching(/offline-mode/));
  });
  it(`returns warning if in use`, async () => {
    jest.mocked(isUrlAvailableAsync).mockResolvedValueOnce(true);
    nock('http://itunes.apple.com')
      .get('/lookup?bundleId=com.bacon.pillarvalley')
      .reply(200, {
        resultCount: 1,
        results: [
          {
            trackName: 'Pillar Valley',
            sellerName: 'Evan Bacon',
            kind: 'software',
            artistName: 'Evan Bacon',
            genres: ['Games', 'Entertainment', 'Family', 'Casual'],
          },
        ],
      });

    expect(
      stripAnsi(await getBundleIdWarningInternalAsync('com.bacon.pillarvalley'))
    ).toMatchInlineSnapshot(
      `"⚠️  The app Pillar Valley by Evan Bacon is already using com.bacon.pillarvalley"`
    );
    expect(isUrlAvailableAsync).toHaveBeenCalledWith('itunes.apple.com');
  });
  it(`returns null when available`, async () => {
    jest.mocked(isUrlAvailableAsync).mockResolvedValueOnce(true);
    nock('http://itunes.apple.com')
      .get('/lookup?bundleId=dev.expo.testapp')
      .reply(200, { resultCount: 0, results: [] });

    expect(await getBundleIdWarningInternalAsync('dev.expo.testapp')).toBeNull();
    expect(isUrlAvailableAsync).toHaveBeenCalledWith('itunes.apple.com');
  });
});

describe(getPackageNameWarningInternalAsync, () => {
  resetOfflineMode();

  it(`returns null if the URL cannot be reached`, async () => {
    jest.mocked(isUrlAvailableAsync).mockResolvedValueOnce(false);
    expect(await getPackageNameWarningInternalAsync('bacon')).toBe(null);
  });
  it(`returns null and warns if running in offline-mode`, async () => {
    process.env.EXPO_OFFLINE = '1';
    expect(await getPackageNameWarningInternalAsync('123')).toBe(null);
    expect(Log.warn).toBeCalledWith(expect.stringMatching(/offline-mode/));
  });
  it(`returns warning if in use`, async () => {
    jest.mocked(isUrlAvailableAsync).mockResolvedValueOnce(true);
    nock('https://play.google.com').get('/store/apps/details?id=com.bacon.pillarvalley').reply(200);

    expect(
      stripAnsi(await getPackageNameWarningInternalAsync('com.bacon.pillarvalley'))
    ).toMatchInlineSnapshot(
      `"⚠️  The package com.bacon.pillarvalley is already in use. Learn more: https://play.google.com/store/apps/details?id=com.bacon.pillarvalley"`
    );
    expect(isUrlAvailableAsync).toHaveBeenCalledWith('play.google.com');
  });
  it(`returns null when available`, async () => {
    jest.mocked(isUrlAvailableAsync).mockResolvedValueOnce(true);
    nock('https://play.google.com').get('/store/apps/details?id=dev.expo.testapp').reply(404);

    expect(await getPackageNameWarningInternalAsync('dev.expo.testapp')).toBeNull();
    expect(isUrlAvailableAsync).toHaveBeenCalledWith('play.google.com');
  });
});
