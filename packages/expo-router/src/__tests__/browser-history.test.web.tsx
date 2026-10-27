/** @jest-environment jsdom */
import React from 'react';
import { Text } from 'react-native';

import { router } from '../imperative-api';
import Stack from '../layouts/Stack';
import { act, renderRouter, screen } from '../testing-library';

describe('browser history', () => {
  // The testing-library cleanup waits on a timer, and `renderRouter` turns on fake timers.
  // This hook is inside `describe` so it runs before that cleanup.
  afterEach(() => {
    jest.useRealTimers();
  });

  it('restores the pushed route after browser back and forward', async () => {
    renderRouter({
      _layout: () => <Stack />,
      index: () => <Text>index</Text>,
      one: () => <Text>one</Text>,
    });

    await act(async () => router.push('/one'));
    expect(screen).toHavePathname('/one');

    await act(async () => {
      window.history.back();
      await jest.runAllTimersAsync();
    });
    expect(screen).toHavePathname('/');

    await act(async () => {
      window.history.forward();
      await jest.runAllTimersAsync();
    });
    expect(screen).toHavePathname('/one');
  });
});
