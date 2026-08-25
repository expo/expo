import { renderHook } from '@testing-library/react-native';
import type { RefObject } from 'react';
import { BackHandler } from 'react-native';

import type { NavigationContainerRef, ParamListBase } from '../../react-navigation/native';
import { useBackButton } from '../useBackButton';

test('a second hardware back press observes the first synchronous pop', () => {
  let onBackPress: (() => boolean | null | undefined) | undefined;
  const remove = jest.fn();
  jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_, listener) => {
    // The hook ignores React Native's hardware event payload.
    onBackPress = () => listener({} as never);
    return { remove };
  });

  let canGoBack = true;
  const dispatchSync = jest.fn(() => {
    canGoBack = false;
  });
  // The hook only uses `canGoBack` and `dispatchSync` from the container ref.
  const ref = {
    current: {
      canGoBack: () => canGoBack,
      dispatchSync,
    } as unknown as NavigationContainerRef<ParamListBase>,
  } as RefObject<NavigationContainerRef<ParamListBase>>;

  const { unmount } = renderHook(() => useBackButton(ref));

  expect(onBackPress?.()).toBe(true);
  expect(onBackPress?.()).toBe(false);
  expect(dispatchSync).toHaveBeenCalledTimes(1);

  unmount();
  expect(remove).toHaveBeenCalledTimes(1);
});
