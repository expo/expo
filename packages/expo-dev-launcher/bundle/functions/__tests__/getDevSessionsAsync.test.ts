import { mockFetchReturn } from '../../test-utils';
import { getDevSessionsAsync } from '../getDevSessionsAsync';

const mockFns = [fetch] as jest.Mock[];

describe('getDevSessionsAsync()', () => {
  beforeEach(() => {
    mockFns.forEach((fn) => fn.mockClear());
  });

  test('authenticated call', async () => {
    expect(fetch).not.toHaveBeenCalled();

    await getDevSessionsAsync({ isAuthenticated: true, installationID: '321', isDevice: true });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/development-sessions'),
      expect.any(Object)
    );
  });

  test('does not use installationId if sessions are found via authenticated request', async () => {
    mockFetchReturn({ data: [{ test: '123' }] });

    expect(fetch).not.toHaveBeenCalled();

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

  test('uses installationId if no sessions are found via authenticated request', async () => {
    mockFetchReturn({ data: [] });

    expect(fetch).not.toHaveBeenCalled();

    await getDevSessionsAsync({ isAuthenticated: true, installationID: '321', isDevice: true });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/development-sessions'),
      expect.any(Object)
    );

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/development-sessions?deviceId'),
      expect.any(Object)
    );
  });

  test('installationId used when no authorized sessions are found', async () => {
    mockFetchReturn({ data: [] });

    expect(fetch).not.toHaveBeenCalled();

    await getDevSessionsAsync({ isAuthenticated: false, installationID: '321', isDevice: true });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/development-sessions?deviceId=321`),
      expect.any(Object)
    );
  });
});
