import ExpoNavigationBar from '../ExpoNavigationBar';
import { NavigationBar, setStyle } from '../NavigationBar.android';

jest.mock('../ExpoNavigationBar', () => ({
  __esModule: true,
  default: {
    setStyle: jest.fn(),
    setHidden: jest.fn(),
  },
}));

jest.mock('react-native', () => ({
  Appearance: {
    getColorScheme: () => 'light',
  },
  useColorScheme: () => 'light',
}));

const mockExpoNavigationBar = jest.mocked(ExpoNavigationBar);

describe('NavigationBar', () => {
  it('handles rejected native style updates', () => {
    const catchError = jest.fn();
    mockExpoNavigationBar.setStyle.mockReturnValue({ catch: catchError } as never);

    setStyle('dark');

    expect(mockExpoNavigationBar.setStyle).toHaveBeenCalledWith('dark');
    expect(catchError).toHaveBeenCalledWith(expect.any(Function));
  });

  it('handles rejected native visibility updates', () => {
    const catchError = jest.fn();
    mockExpoNavigationBar.setHidden.mockReturnValue({ catch: catchError } as never);

    NavigationBar.setHidden(true);

    expect(mockExpoNavigationBar.setHidden).toHaveBeenCalledWith(true);
    expect(catchError).toHaveBeenCalledWith(expect.any(Function));
  });
});
