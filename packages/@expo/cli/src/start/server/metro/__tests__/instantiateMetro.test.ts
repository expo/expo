import { Log } from '../../../../log';
import { isWatchEnabled } from '../instantiateMetro';

jest.mock('../../../../log');

describe(isWatchEnabled, () => {
  const originalValue = process.env.CI;

  beforeEach(() => {
    delete process.env.CI;
  });

  afterEach(() => {
    process.env.CI = originalValue;
  });

  it('is enabled without CI', () => {
    expect(isWatchEnabled()).toBe(true);
  });

  it('is enabled with CI=false', () => {
    process.env.CI = 'false';
    expect(isWatchEnabled()).toBe(true);
  });

  it('is disabled with CI=true', () => {
    process.env.CI = 'true';
    expect(isWatchEnabled()).toBe(false);
    expect(Log.log).toHaveBeenCalledWith(expect.stringContaining('Metro is running in CI mode'));
  });
});
