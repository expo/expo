import { useEffect, useRef } from 'react';
import NativeReanimated from '../NativeReanimated';
import { makeMutable } from '../core';
import { AnimatedKeyboardInfo, KeyboardState } from '../commonTypes';

export function useAnimatedKeyboard(): AnimatedKeyboardInfo {
  const ref = useRef<AnimatedKeyboardInfo | null>(null);
  const listenerId = useRef<number>(-1);
  const isSubscribed = useRef<boolean>(false);

  if (ref.current === null) {
    const keyboardEventData: AnimatedKeyboardInfo = {
      state: makeMutable(KeyboardState.UNKNOWN),
      height: makeMutable(0),
    };
    listenerId.current =
      NativeReanimated.subscribeForKeyboardEvents(keyboardEventData);
    ref.current = keyboardEventData;
    isSubscribed.current = true;
  }
  useEffect(() => {
    if (isSubscribed.current === false && ref.current !== null) {
      // subscribe again after Fast Refresh
      listenerId.current = NativeReanimated.subscribeForKeyboardEvents(
        ref.current
      );
      isSubscribed.current = true;
    }
    return () => {
      NativeReanimated.unsubscribeFromKeyboardEvents(listenerId.current);
      isSubscribed.current = false;
    };
  }, []);
  return ref.current;
}
