import { RefObject, useEffect, useRef } from 'react';

import type Animated from 'react-native-reanimated';
import { ScrollEvent } from './useAnimatedScrollHandler';
import { SharedValue } from '../commonTypes';
import { findNodeHandle } from 'react-native';
import { useEvent } from './utils';
import { useSharedValue } from './useSharedValue';

const subscribeForEvents = [
  'onScroll',
  'onScrollBeginDrag',
  'onScrollEndDrag',
  'onMomentumScrollBegin',
  'onMomentumScrollEnd',
];

export function useScrollViewOffset(
  aref: RefObject<Animated.ScrollView>
): SharedValue<number> {
  const offsetRef = useRef(useSharedValue(0));

  const event = useEvent<ScrollEvent>((event: ScrollEvent) => {
    'worklet';
    offsetRef.current.value =
      event.contentOffset.x === 0
        ? event.contentOffset.y
        : event.contentOffset.x;
  }, subscribeForEvents);

  useEffect(() => {
    const viewTag = findNodeHandle(aref.current);
    event.current?.registerForEvents(viewTag as number);
  }, [aref.current]);

  return offsetRef.current;
}
