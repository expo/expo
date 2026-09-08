import { getInitialURLWithTimeout } from '../../fork/getInitialURLWithTimeout';
import { getInitialURL } from '../linking';

jest.mock('expo-linking', () => ({
  createURL: jest.fn((path: string) => `yourscheme://${path}`),
}));

jest.mock('../../fork/getInitialURLWithTimeout', () => ({
  getInitialURLWithTimeout: jest.fn(),
}));

const mockedGetInitialURLWithTimeout = jest.mocked(getInitialURLWithTimeout);

beforeEach(() => {
  mockedGetInitialURLWithTimeout.mockReset();
});

it('uses the Android initial URL when one is available', async () => {
  mockedGetInitialURLWithTimeout.mockReturnValue('yourscheme:///profile/evan');

  await expect(getInitialURL()).resolves.toBe('yourscheme:///profile/evan');
});

it('uses the root URL when Android has no initial URL', async () => {
  mockedGetInitialURLWithTimeout.mockReturnValue(null);

  await expect(getInitialURL()).resolves.toBe('yourscheme:///');
});
