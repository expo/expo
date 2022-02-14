import { mockFetchReturn } from '../../test-utils';
import { getDevSessionsAsync } from '../getDevSessionsAsync';

const mockFns = [fetch] as jest.Mock[];

describe('getDevSessionsAsync()', () => {
  beforeEach(() => {
    mockFns.forEach((fn) => fn.mockClear());
  });

  test('authenticated call', async () => {
    await getDevSessionsAsync({ isAuthenticated: true, installationID: '321', isDevice: true });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/development-sessions'),
      expect.any(Object)
    );
  });

  test('does not use installationI if sessions are found via authenticated request', async () => {
    mockFetchReturn({ data: [{ test: '123' }] });

    await getDevSessionsAsync({ isAuthenticated: true, installationID: '321', isDevice: true });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/development-sessions'),
      expect.any(Object)
    );

    expect(fetch).not.toHaveBeenCalledWith(
      expect.stringContaining('/development-sessions?deviceId'),
      expect.any(Object)
    );
  });

  test('installationId used when no authorized sessions are found', async () => {
    mockFetchReturn({ data: [] });

    await getDevSessionsAsync({ isAuthenticated: false, installationID: '321', isDevice: true });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/development-sessions?deviceId=321`),
      expect.any(Object)
    );
  });
});
