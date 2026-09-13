/** @jest-environment jsdom */
import { act, render, screen } from '@testing-library/react';
import * as React from 'react';
import { View } from 'react-native';

import { ExpoRoot } from '../../../ExpoRoot';
import { getRouteInfoFromState } from '../../../global-state/getRouteInfoFromState';
import { navigationRef } from '../../../global-state/navigationRef';
import { router } from '../../../imperative-api';
import Stack from '../../../layouts/StackClient';
import { getMockContext } from '../../../testing-library/mock-config';
import { usePreventRemove } from '../usePreventRemove';

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as typeof ResizeObserver;

test('allows router back after disabling prevention', () => {
  let discard: () => void;
  const onPreventRemove = jest.fn();
  const Form = () => {
    const [dirty, setDirty] = React.useState(true);
    const disablePrevention = usePreventRemove(dirty, onPreventRemove);
    discard = () => {
      setDirty(false);
      disablePrevention();
      router.back();
    };
    return <View testID="form" />;
  };

  process.env.EXPO_ROUTER_IMPORT_MODE = 'sync';
  const context = getMockContext({
    _layout: () => <Stack />,
    index: () => <View testID="index" />,
    form: Form,
  });
  render(<ExpoRoot context={context} location="/" />);

  act(() => router.push('/form'));
  act(() => router.back());

  expect(screen.getByTestId('form')).toBeTruthy();
  expect(getRouteInfoFromState(navigationRef.getRootState()).pathname).toBe('/form');
  expect(onPreventRemove).toHaveBeenCalledTimes(1);

  act(() => discard());

  expect(getRouteInfoFromState(navigationRef.getRootState()).pathname).toBe('/');
  expect(onPreventRemove).toHaveBeenCalledTimes(1);
});

test('allows parent back after disabling nested prevention', () => {
  let discard: () => void;
  const onPreventRemove = jest.fn();
  const Form = () => {
    const [dirty, setDirty] = React.useState(true);
    const disablePrevention = usePreventRemove(dirty, onPreventRemove);
    discard = () => {
      setDirty(false);
      disablePrevention();
      router.back();
    };
    return <View testID="nested-form" />;
  };

  process.env.EXPO_ROUTER_IMPORT_MODE = 'sync';
  const context = getMockContext({
    _layout: () => <Stack />,
    index: () => <View testID="index" />,
    'nested/_layout': () => <Stack />,
    'nested/index': Form,
  });
  render(<ExpoRoot context={context} location="/" />);

  act(() => router.push('/nested'));
  act(() => router.back());
  expect(getRouteInfoFromState(navigationRef.getRootState()).pathname).toBe('/nested');
  expect(onPreventRemove).toHaveBeenCalledTimes(1);

  act(() => discard());
  expect(getRouteInfoFromState(navigationRef.getRootState()).pathname).toBe('/');
  expect(onPreventRemove).toHaveBeenCalledTimes(1);
});
