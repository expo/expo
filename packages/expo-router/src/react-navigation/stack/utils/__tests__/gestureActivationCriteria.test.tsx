import { expect, test } from '@jest/globals';

import { gestureActivationCriteria } from '../gestureActivationCriteria';

test('horizontal gesture uses activeOffsetX and failOffsetY', () => {
  expect(
    gestureActivationCriteria({
      direction: 'ltr',
      gestureDirection: 'horizontal',
      layout: { width: 400, height: 800 },
    })
  ).toEqual({
    activeOffsetX: 5,
    failOffsetY: [-20, 20],
    hitSlop: { right: -350 },
    enableTrackpadTwoFingerGesture: true,
  });
});

test('horizontal-inverted gesture uses negative activeOffsetX and failOffsetY', () => {
  expect(
    gestureActivationCriteria({
      direction: 'ltr',
      gestureDirection: 'horizontal-inverted',
      layout: { width: 400, height: 800 },
    })
  ).toEqual({
    activeOffsetX: -5,
    failOffsetY: [-20, 20],
    hitSlop: { left: -350 },
    enableTrackpadTwoFingerGesture: true,
  });
});

test('vertical gesture uses activeOffsetY and failOffsetX', () => {
  expect(
    gestureActivationCriteria({
      direction: 'ltr',
      gestureDirection: 'vertical',
      layout: { width: 400, height: 800 },
    })
  ).toEqual({
    activeOffsetY: 5,
    failOffsetX: [-15, 15],
    hitSlop: { bottom: -665 },
    enableTrackpadTwoFingerGesture: true,
  });
});

test('vertical-inverted gesture uses negative activeOffsetY and failOffsetX', () => {
  expect(
    gestureActivationCriteria({
      direction: 'ltr',
      gestureDirection: 'vertical-inverted',
      layout: { width: 400, height: 800 },
    })
  ).toEqual({
    activeOffsetY: -5,
    failOffsetX: [-15, 15],
    hitSlop: { top: -665 },
    enableTrackpadTwoFingerGesture: true,
  });
});
