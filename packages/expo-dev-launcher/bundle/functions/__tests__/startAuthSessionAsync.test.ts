import { websiteOrigin } from '../../apiClient';
import { openAuthSessionAsync, getAuthSchemeAsync } from '../../native-modules/DevLauncherAuth';
import { startAuthSessionAsync } from '../startAuthSessionAsync';

const mockOpenAuthSessionAsync = openAuthSessionAsync as jest.Mock;
const mockGetAuthSchemeAsync = getAuthSchemeAsync as jest.Mock;

describe('startAuthSessionAsync()', () => {
  beforeEach(() => {
    mockOpenAuthSessionAsync.mockResolvedValue({
      type: 'success',
      url: 'http://yay/123?session_secret=123',
    });
  });

  afterEach(() => {
    mockOpenAuthSessionAsync.mockClear();
    mockGetAuthSchemeAsync.mockClear();
  });

  test('signup calls openAuthSessionAsync()', async () => {
    const fakeScheme = 'test-scheme';
    mockGetAuthSchemeAsync.mockResolvedValue(fakeScheme);

    expect(openAuthSessionAsync).not.toHaveBeenCalled();
    expect(getAuthSchemeAsync).not.toHaveBeenCalled();
    await startAuthSessionAsync('signup');
    expect(getAuthSchemeAsync).toHaveBeenCalled();
    expect(openAuthSessionAsync).toHaveBeenCalled();
    expect(openAuthSessionAsync).toHaveBeenCalledWith(
      expect.stringContaining('signup'),
      expect.stringMatching(fakeScheme)
    );
    expect(openAuthSessionAsync).toHaveBeenCalledWith(
      expect.stringContaining(websiteOrigin),
      expect.stringMatching(fakeScheme)
    );
  });

  test('login calls openAuthSessionAsync()', async () => {
    const fakeScheme = 'another-test-scheme';
    mockGetAuthSchemeAsync.mockResolvedValue(fakeScheme);

    expect(openAuthSessionAsync).not.toHaveBeenCalled();
    expect(getAuthSchemeAsync).not.toHaveBeenCalled();

    await startAuthSessionAsync('login');

    expect(openAuthSessionAsync).toHaveBeenCalled();
    expect(getAuthSchemeAsync).toHaveBeenCalled();
    expect(openAuthSessionAsync).toHaveBeenCalledWith(
      expect.stringContaining('login'),
      expect.stringMatching(fakeScheme)
    );
    expect(openAuthSessionAsync).toHaveBeenCalledWith(
      expect.stringContaining(websiteOrigin),
      expect.stringMatching(fakeScheme)
    );
  });
});
