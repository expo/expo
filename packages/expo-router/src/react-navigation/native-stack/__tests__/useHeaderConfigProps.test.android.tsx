import { render, renderHook, within } from '@testing-library/react-native';
import React from 'react';
import { View } from 'react-native';

import {
  DEFAULT_COLORS,
  DEFAULT_FONTS,
  defaultProps,
  getMocks,
} from './useHeaderConfigProps-setup';
import { useHeaderConfigProps } from '../views/useHeaderConfigProps';

jest.mock('react-native-screens', () => {
  const MockedReact = require('react');
  const RN = require('react-native');
  const mockComp = (testID: string) =>
    jest.fn(({ children, ...props }: any) =>
      MockedReact.createElement(RN.View, { testID, ...props }, children)
    );
  return {
    isSearchBarAvailableForCurrentPlatform: true,
    ScreenStackHeaderBackButtonImage: mockComp('ScreenStackHeaderBackButtonImage'),
    ScreenStackHeaderCenterView: mockComp('ScreenStackHeaderCenterView'),
    ScreenStackHeaderLeftView: mockComp('ScreenStackHeaderLeftView'),
    ScreenStackHeaderRightView: mockComp('ScreenStackHeaderRightView'),
    ScreenStackHeaderSearchBarView: mockComp('ScreenStackHeaderSearchBarView'),
    SearchBar: mockComp('SearchBar'),
  };
});

jest.mock('../../native', () => ({
  useLocale: jest.fn(),
  useTheme: jest.fn(),
}));

jest.mock('../views/FontProcessor', () => ({
  processFonts: jest.fn((families: (string | undefined)[]) => families),
}));

jest.mock('../../elements', () => {
  const MockedReact = require('react');
  const RN = require('react-native');
  return {
    getHeaderTitle: (
      options: { title?: string; headerTitle?: string | ((...args: any[]) => any) },
      fallback: string
    ) =>
      typeof options.headerTitle === 'string'
        ? options.headerTitle
        : options.title !== undefined
          ? options.title
          : fallback,
    HeaderTitle: jest.fn(({ children, ...props }: any) =>
      MockedReact.createElement(RN.Text, props, children)
    ),
  };
});

const { mockedUseLocale, mockedUseTheme } = getMocks();

afterEach(() => {
  jest.restoreAllMocks();
});

beforeEach(() => {
  mockedUseLocale.mockReturnValue({ direction: 'ltr' });
  mockedUseTheme.mockReturnValue({
    dark: false,
    colors: DEFAULT_COLORS,
    fonts: DEFAULT_FONTS,
  } as any);
});

// ─── tintColor ──────────────────────────────────────────────────────────────────

describe('tintColor', () => {
  test('defaults to colors.text on Android', () => {
    const { result } = renderHook(() => useHeaderConfigProps(defaultProps()));
    expect(result.current.color).toBe(DEFAULT_COLORS.text);
  });

  test('custom headerTintColor overrides default', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(defaultProps({ headerTintColor: 'green' }))
    );
    expect(result.current.color).toBe('green');
  });
});

// ─── backgroundColor ────────────────────────────────────────────────────────────

describe('backgroundColor', () => {
  test('not transparent when headerLargeTitleEnabled on Android', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(defaultProps({ headerLargeTitleEnabled: true }))
    );
    expect(result.current.backgroundColor).toBe(DEFAULT_COLORS.card);
  });
});

// ─── translucent ────────────────────────────────────────────────────────────────

describe('translucent', () => {
  test('false with large title (no iOS-specific translucency)', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(defaultProps({ headerLargeTitleEnabled: true }))
    );
    expect(result.current.translucent).toBe(false);
  });
});

// ─── backButtonDisplayMode ──────────────────────────────────────────────────────

describe('backButtonDisplayMode', () => {
  test('falls back on Android (not iOS)', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(defaultProps({ headerBackButtonDisplayMode: 'minimal' }))
    );
    expect(result.current.backButtonDisplayMode).toBeUndefined();
  });
});

// ─── backButtonInCustomView ─────────────────────────────────────────────────────

describe('backButtonInCustomView', () => {
  test('true when headerTitle is a function and no headerLeft', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(defaultProps({ headerTitle: () => <View /> }))
    );
    expect(result.current.backButtonInCustomView).toBe(true);
  });

  test('false when headerTitle is function but headerLeft is provided', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(
        defaultProps({ headerTitle: () => <View />, headerLeft: () => <View /> })
      )
    );
    expect(result.current.backButtonInCustomView).toBeFalsy();
  });
});

// ─── children rendering (Android) ───────────────────────────────────────────────

describe('children rendering', () => {
  test('headerLeft and headerTitle function in ScreenStackHeaderLeftView', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(
        defaultProps({
          headerLeft: () => <View testID="left" />,
          headerTitle: () => <View testID="title-fn" />,
        })
      )
    );
    const { getByTestId } = render(<>{result.current.children}</>);
    const leftView = getByTestId('ScreenStackHeaderLeftView');
    expect(within(leftView).getByTestId('left')).toBeTruthy();
    expect(within(leftView).getByTestId('title-fn')).toBeTruthy();
  });

  test('headerTitleAlign center renders title in ScreenStackHeaderCenterView', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(defaultProps({ headerTitleAlign: 'center' }))
    );
    const { getByTestId } = render(<>{result.current.children}</>);
    expect(getByTestId('ScreenStackHeaderCenterView')).toBeTruthy();
  });

  test('headerRight renders in ScreenStackHeaderRightView', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(defaultProps({ headerRight: () => <View testID="header-right" /> }))
    );
    const { getByTestId } = render(<>{result.current.children}</>);
    const rightView = getByTestId('ScreenStackHeaderRightView');
    expect(within(rightView).getByTestId('header-right')).toBeTruthy();
  });

  test('headerTitle function without headerLeft renders in ScreenStackHeaderLeftView', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(defaultProps({ headerTitle: () => <View testID="title-only" /> }))
    );
    const { getByTestId } = render(<>{result.current.children}</>);
    const leftView = getByTestId('ScreenStackHeaderLeftView');
    expect(within(leftView).getByTestId('title-only')).toBeTruthy();
  });
});
