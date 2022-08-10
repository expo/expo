import { getBranchApiKey, setBranchApiKey } from '../withIosBranch';

describe('branch', () => {
  it(`returns null if no api key is provided`, () => {
    expect(getBranchApiKey({})).toBe(null);
  });

  it(`returns the api key if provided`, () => {
    expect(getBranchApiKey({ ios: { config: { branch: { apiKey: '123' } } } })).toBe('123');
  });

  it(`sets branch_key.live if the api key is given`, () => {
    expect(setBranchApiKey({ ios: { config: { branch: { apiKey: '123' } } } }, {})).toMatchObject({
      branch_key: {
        live: '123',
      },
    });
  });

  it(`makes no changes to the infoPlist no api key is provided`, () => {
    expect(setBranchApiKey({}, {})).toMatchObject({});
  });
});
