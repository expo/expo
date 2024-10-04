import fetch from 'node-fetch';

import { Log } from '../../log';
import { stripAnsi } from '../ansi';
import { isUrlAvailableAsync } from '../url';
import {
  getBundleIdWarningInternalAsync,
  getPackageNameWarningInternalAsync,
  validateBundleId,
  validatePackage,
} from '../validateApplicationId';

jest.mock('node-fetch');
jest.mock('../../log');
jest.mock('../url');

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

describe(validatePackage, () => {
  it(`validates`, () => {
    expect(validatePackage('bacon.com.hey')).toBe(true);
    expect(validatePackage('bacon')).toBe(false);
    expect(validatePackage('...b.a.-c.0.n...')).toBe(false);
    expect(validatePackage('.')).toBe(false);
    expect(validatePackage('. ..')).toBe(false);
    expect(validatePackage('_')).toBe(false);
    expect(validatePackage(',')).toBe(false);
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

    jest.mocked(fetch).mockResolvedValueOnce({
      status: 200,
      json() {
        return Promise.resolve({
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
      },
    } as any);

    expect(
      stripAnsi(await getBundleIdWarningInternalAsync('com.bacon.pillarvalley'))
    ).toMatchInlineSnapshot(
      `"⚠️  The app Pillar Valley by Evan Bacon is already using com.bacon.pillarvalley"`
    );
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
    jest.mocked(fetch).mockResolvedValueOnce({
      status: 200,
    } as any);

    expect(
      stripAnsi(await getPackageNameWarningInternalAsync('com.bacon.pillarvalley'))
    ).toMatchInlineSnapshot(
      `"⚠️  The package com.bacon.pillarvalley is already in use. Learn more: https://play.google.com/store/apps/details?id=com.bacon.pillarvalley"`
    );
  });
});
