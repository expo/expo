import fetch from 'node-fetch';

import { isUrlAvailableAsync } from '../url';
import {
  getBundleIdWarningAsync,
  getPackageNameWarningAsync,
  validateBundleId,
  validatePackage,
} from '../validateApplicationId';

jest.mock('../url');
jest.mock('node-fetch');

const originalForceColor = process.env.FORCE_COLOR;
beforeAll(async () => {
  process.env.FORCE_COLOR = '1';
});
afterAll(() => {
  process.env.FORCE_COLOR = originalForceColor;
});

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

describe(getBundleIdWarningAsync, () => {
  it(`returns null if the URL cannot be reached`, async () => {
    (isUrlAvailableAsync as jest.Mock).mockResolvedValueOnce(false);
    expect(await getBundleIdWarningAsync('bacon')).toBe(null);
  });
  it(`returns warning if in use`, async () => {
    (isUrlAvailableAsync as jest.Mock).mockResolvedValueOnce(true);

    (fetch as any).mockImplementationOnce(() => ({
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
    }));
    expect(await getBundleIdWarningAsync('com.bacon.pillarvalley')).toMatchInlineSnapshot(
      `"⚠️  The app [1mPillar Valley[22m by [3mEvan Bacon[23m is already using [1mcom.bacon.pillarvalley[22m"`
    );
  });
});
describe(getPackageNameWarningAsync, () => {
  it(`returns null if the URL cannot be reached`, async () => {
    (isUrlAvailableAsync as jest.Mock).mockResolvedValueOnce(false);
    expect(await getPackageNameWarningAsync('bacon')).toBe(null);
  });
  it(`returns warning if in use`, async () => {
    (isUrlAvailableAsync as jest.Mock).mockResolvedValueOnce(true);

    (fetch as any).mockImplementationOnce(() => ({
      status: 200,
    }));
    expect(await getPackageNameWarningAsync('com.bacon.pillarvalley')).toMatchInlineSnapshot(
      `"⚠️  The package [1mcom.bacon.pillarvalley[22m is already in use. [2mLearn more: [4mhttps://play.google.com/store/apps/details?id=com.bacon.pillarvalley[24m[22m"`
    );
  });
});
