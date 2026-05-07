import * as AgeRange from '../AgeRange';
import ExpoAgeRange from '../ExpoAgeRange';

jest.mock('../ExpoAgeRange', () => ({
  __esModule: true,
  default: {
    requestAgeRangeAsync: jest.fn(),
    isEligibleForAgeFeaturesAsync: jest.fn(),
  },
}));

describe('isEligibleForAgeFeaturesAsync', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('resolves true when the native API reports eligibility', async () => {
    jest.mocked(ExpoAgeRange.isEligibleForAgeFeaturesAsync).mockResolvedValueOnce(true);

    await expect(AgeRange.isEligibleForAgeFeaturesAsync()).resolves.toBe(true);
  });

  it('resolves false when the native API reports no eligibility', async () => {
    jest.mocked(ExpoAgeRange.isEligibleForAgeFeaturesAsync).mockResolvedValueOnce(false);

    await expect(AgeRange.isEligibleForAgeFeaturesAsync()).resolves.toBe(false);
  });

  it('resolves null when the native API reports unsupported or unknown', async () => {
    jest.mocked(ExpoAgeRange.isEligibleForAgeFeaturesAsync).mockResolvedValueOnce(null);

    await expect(AgeRange.isEligibleForAgeFeaturesAsync()).resolves.toBeNull();
  });
});
