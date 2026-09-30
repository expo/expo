/** @jest-environment jsdom */

import { act } from '@testing-library/react-native';
import { Text } from 'react-native';

import { router } from '../exports';
import { Stack } from '../layouts/Stack';
import { unstable_navigationEvents } from '../navigationEvents';
import type { BasePageEvent } from '../navigationEvents/types';
import { renderRouter } from '../testing-library';

it('reports page focus and blur payloads during web navigation', () => {
  unstable_navigationEvents.enable();
  const focused: BasePageEvent[] = [];
  const blurred: BasePageEvent[] = [];
  const stopFocus = unstable_navigationEvents.addListener('pageFocused', (event) =>
    focused.push(event)
  );
  const stopBlur = unstable_navigationEvents.addListener('pageBlurred', (event) =>
    blurred.push(event)
  );
  const result = renderRouter({
    _layout: () => <Stack />,
    index: () => <Text>Home</Text>,
    details: () => <Text>Details</Text>,
  });
  try {
    expect(focused).toContainEqual(
      expect.objectContaining({
        pathname: '/',
        params: {},
        segments: [],
        screenId: expect.any(String),
      })
    );
    act(() => router.push('/details'));
    expect(blurred).toContainEqual(
      expect.objectContaining({
        pathname: '/',
        params: {},
        segments: [],
        screenId: expect.any(String),
      })
    );
    expect(focused).toContainEqual(
      expect.objectContaining({
        pathname: '/details',
        params: {},
        segments: ['details'],
        screenId: expect.any(String),
      })
    );
    act(() => router.back());
    expect(focused.filter((event) => event.pathname === '/')).toHaveLength(2);
  } finally {
    result.unmount();
    jest.useRealTimers();
    stopFocus();
    stopBlur();
  }
});
