import { act, screen } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import { router } from '../../imperative-api';
import { renderRouter, testRouter } from '../../testing-library';
import { NativeStack } from '../NativeStack';

jest.mock('react-native-screens/experimental', () => {
  const actual = jest.requireActual(
    'react-native-screens/experimental'
  ) as typeof import('react-native-screens/experimental');
  const MockedScreen = jest.fn((props: any) => <actual.Stack.Screen {...props} />);
  return {
    ...actual,
    Stack: {
      ...actual.Stack,
      Screen: MockedScreen,
    },
  };
});

const { Stack } = jest.requireMock(
  'react-native-screens/experimental'
) as typeof import('react-native-screens/experimental');
const MockedStackScreen = Stack.Screen as jest.MockedFunction<typeof Stack.Screen>;

describe('NativeStack', () => {
  beforeEach(() => {
    MockedStackScreen.mockClear();
  });

  describe('basic navigation', () => {
    it('renders the initial route', () => {
      renderRouter({
        _layout: () => <NativeStack />,
        index: () => <Text testID="index">Index</Text>,
      });

      expect(screen.getByTestId('index')).toBeVisible();
      expect(screen).toHavePathname('/');
    });

    it('can push and navigate between routes', () => {
      renderRouter({
        _layout: () => <NativeStack />,
        index: () => <Text testID="index">Index</Text>,
        profile: () => <Text testID="profile">Profile</Text>,
      });

      expect(screen.getByTestId('index')).toBeVisible();

      act(() => router.push('/profile'));
      expect(screen.getByTestId('profile')).toBeVisible();
      expect(screen).toHavePathname('/profile');
    });

    it('can go back after pushing', () => {
      renderRouter({
        _layout: () => <NativeStack />,
        index: () => <Text testID="index">Index</Text>,
        details: () => <Text testID="details">Details</Text>,
      });

      act(() => router.push('/details'));
      expect(screen).toHavePathname('/details');

      act(() => router.back());
      expect(screen).toHavePathname('/');
    });

    it('can push multiple screens and dismiss', () => {
      renderRouter(
        {
          _layout: () => <NativeStack />,
          a: () => <Text>A</Text>,
          b: () => <Text>B</Text>,
          c: () => <Text>C</Text>,
        },
        { initialUrl: '/a' }
      );

      act(() => router.push('/b'));
      act(() => router.push('/c'));
      expect(screen).toHavePathname('/c');

      act(() => router.dismiss());
      expect(screen).toHavePathname('/b');
    });

    it('can replace the current route', () => {
      renderRouter({
        _layout: () => <NativeStack />,
        index: () => <Text testID="index">Index</Text>,
        a: () => <Text testID="a">A</Text>,
        b: () => <Text testID="b">B</Text>,
      });

      act(() => router.push('/a'));
      expect(screen).toHavePathname('/a');

      act(() => router.replace('/b'));
      expect(screen).toHavePathname('/b');

      act(() => router.back());
      expect(screen).toHavePathname('/');
    });
  });

  describe('activityMode', () => {
    it('sets detached for non-focused screens by default', () => {
      renderRouter({
        _layout: () => <NativeStack />,
        index: () => <Text testID="index">Index</Text>,
        details: () => <Text testID="details">Details</Text>,
      });

      act(() => router.push('/details'));

      // After pushing, the index screen should be detached (frozen)
      const indexCalls = MockedStackScreen.mock.calls.filter((call) =>
        call[0].screenKey?.includes('index')
      );
      const lastIndexCall = indexCalls[indexCalls.length - 1];
      expect(lastIndexCall[0].activityMode).toBe('detached');
    });

    it('sets attached for focused screen', () => {
      renderRouter({
        _layout: () => <NativeStack />,
        index: () => <Text testID="index">Index</Text>,
        details: () => <Text testID="details">Details</Text>,
      });

      act(() => router.push('/details'));

      const detailsCalls = MockedStackScreen.mock.calls.filter((call) =>
        call[0].screenKey?.includes('details')
      );
      const lastDetailsCall = detailsCalls[detailsCalls.length - 1];
      expect(lastDetailsCall[0].activityMode).toBe('attached');
    });

    it('respects freezeOnBlur: false', () => {
      renderRouter({
        _layout: () => (
          <NativeStack>
            <NativeStack.Screen name="index" options={{ freezeOnBlur: false }} />
            <NativeStack.Screen name="details" />
          </NativeStack>
        ),
        index: () => <Text testID="index">Index</Text>,
        details: () => <Text testID="details">Details</Text>,
      });

      act(() => router.push('/details'));

      const indexCalls = MockedStackScreen.mock.calls.filter((call) =>
        call[0].screenKey?.includes('index')
      );
      const lastIndexCall = indexCalls[indexCalls.length - 1];
      expect(lastIndexCall[0].activityMode).toBe('attached');
    });
  });

  describe('screenOptions', () => {
    it('applies screenOptions to all screens', () => {
      renderRouter({
        _layout: () => <NativeStack screenOptions={{ freezeOnBlur: false }} />,
        index: () => <Text testID="index">Index</Text>,
        details: () => <Text testID="details">Details</Text>,
      });

      act(() => router.push('/details'));

      // With freezeOnBlur: false, index should stay attached even when not focused
      const indexCalls = MockedStackScreen.mock.calls.filter((call) =>
        call[0].screenKey?.includes('index')
      );
      const lastIndexCall = indexCalls[indexCalls.length - 1];
      expect(lastIndexCall[0].activityMode).toBe('attached');
    });
  });

  describe('dynamic routes', () => {
    it('supports dynamic route segments', () => {
      renderRouter({
        _layout: () => <NativeStack />,
        index: () => <Text testID="index">Index</Text>,
        'user/[id]': () => <Text testID="user">User</Text>,
      });

      act(() => router.push('/user/123'));
      expect(screen).toHavePathname('/user/123');
      expect(screen.getByTestId('user')).toBeVisible();
    });
  });

  describe('dismissAll', () => {
    it('can dismiss all screens back to root', () => {
      renderRouter(
        {
          _layout: () => <NativeStack />,
          a: () => <Text>A</Text>,
          b: () => <Text>B</Text>,
          c: () => <Text>C</Text>,
        },
        { initialUrl: '/a' }
      );

      testRouter.push('/b');
      testRouter.push('/c');

      expect(screen).toHavePathname('/c');

      testRouter.dismissAll();
      expect(screen).toHavePathname('/a');
      expect(router.canDismiss()).toBe(false);
    });
  });

  describe('canDismiss', () => {
    it('returns false on root screen', () => {
      renderRouter({
        _layout: () => <NativeStack />,
        index: () => <Text>Index</Text>,
      });

      expect(router.canDismiss()).toBe(false);
    });

    it('returns true after pushing', () => {
      renderRouter({
        _layout: () => <NativeStack />,
        index: () => <Text>Index</Text>,
        details: () => <Text>Details</Text>,
      });

      act(() => router.push('/details'));
      expect(router.canDismiss()).toBe(true);
    });
  });
});
