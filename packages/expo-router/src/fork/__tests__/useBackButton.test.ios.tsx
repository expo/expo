import { renderHook } from '@testing-library/react-native';
import type { RefObject } from 'react';
import { BackHandler } from 'react-native';

import type { NavigationContainerRef, ParamListBase } from '../../react-navigation/native';
import { useBackButton } from '../useBackButton';

test('a second hardware back press observes the first synchronous pop', async () => {
  let onBackPress: (() => boolean | null | undefined) | undefined;
  const remove = jest.fn();
  jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_, listener) => {
    // The hook ignores React Native's hardware event payload.
    onBackPress = () => listener({} as never);
    return { remove, setNativeNavigationFallback: jest.fn() };
  });

  let canGoBack = true;
  const dispatchSync = jest.fn(() => {
    canGoBack = false;
  });
  // The hook only uses `canGoBack` and `dispatchSync` from the container ref.
  const ref = {
    current: {
      canGoBack: () => canGoBack,
      isNativeBackNavigationOwned: () => false,
      addListener: () => () => {},
      dispatchSync,
    } as unknown as NavigationContainerRef<ParamListBase>,
  } as RefObject<NavigationContainerRef<ParamListBase>>;

  const { unmount } = await renderHook(() => useBackButton(ref));

  expect(onBackPress?.()).toBe(true);
  expect(onBackPress?.()).toBe(false);
  expect(dispatchSync).toHaveBeenCalledTimes(1);

  await unmount();
  expect(remove).toHaveBeenCalledTimes(1);
});

test('updates native fallback ownership without reordering the BackHandler subscription', async () => {
  let nativeOwned = false;
  const listeners = new Map<string, () => void>();
  const remove = jest.fn();
  const setNativeNavigationFallback = jest.fn();
  const subscribe = jest.spyOn(BackHandler, 'addEventListener').mockReturnValue({
    remove,
    setNativeNavigationFallback,
  } as ReturnType<typeof BackHandler.addEventListener>);
  const ref = {
    current: {
      canGoBack: () => true,
      dispatchSync: jest.fn(),
      isNativeBackNavigationOwned: () => nativeOwned,
      addListener: (name: string, callback: () => void) => {
        listeners.set(name, callback);
        return () => {
          listeners.delete(name);
        };
      },
    },
  } as unknown as RefObject<NavigationContainerRef<ParamListBase>>;
  const result = await renderHook(() => useBackButton(ref));
  expect(setNativeNavigationFallback).toHaveBeenLastCalledWith(false);
  nativeOwned = true;
  listeners.get('nativeBackOwnershipChange')?.();
  expect(setNativeNavigationFallback).toHaveBeenLastCalledWith(true);
  nativeOwned = false;
  listeners.get('state')?.();
  expect(setNativeNavigationFallback).toHaveBeenLastCalledWith(false);
  expect(subscribe).toHaveBeenCalledTimes(1);
  await result.unmount();
  expect(listeners.size).toBe(0);
  expect(remove).toHaveBeenCalledTimes(1);
});
