import * as Linking from 'expo-linking';

import { getInitialURL } from '../linking';

jest.mock('expo-linking', () => ({
  createURL: jest.fn((path: string) => `yourscheme://${path}`),
  getLinkingURL: jest.fn(),
}));

const mockedLinking = jest.mocked(Linking);

beforeEach(() => {
  mockedLinking.getLinkingURL.mockReset();
});

it('uses the iOS linking URL when one is available', () => {
  mockedLinking.getLinkingURL.mockReturnValue('yourscheme:///profile/evan?tab=posts');

  expect(getInitialURL()).toBe('yourscheme:///profile/evan?tab=posts');
});

it('uses the root URL when iOS has no linking URL', () => {
  mockedLinking.getLinkingURL.mockReturnValue(null);

  expect(getInitialURL()).toBe('yourscheme:///');
});
