import { act } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { Text } from 'react-native';

import { router } from '../../imperative-api';
import Stack from '../../layouts/StackClient';
import { renderRouter } from '../../testing-library';
import { Slot } from '../../views/Navigator';
import { SplitView } from '../split-view';

// Each warning shows once per module instance, so these tests use their own test file and run in order.

jest.mock('../../optional-libraries/react-native-screens', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  const actual = jest.requireActual(
    '../../optional-libraries/react-native-screens'
  ) as typeof import('../../optional-libraries/react-native-screens');

  return {
    ...actual,
    Split: {
      ...actual.Split,
      Host: ({ children }: { children?: ReactNode }) => <View>{children}</View>,
      Column: ({ children }: { children?: ReactNode }) => <View>{children}</View>,
    },
  };
});

it('warns when no SplitView receives the column request', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  await renderRouter(
    {
      _layout: () => <Slot />,
      index: () => <Text>Index</Text>,
      '[mailId]': () => <Text>Mail</Text>,
    },
    { initialUrl: '/' }
  );

  await act(() => router.navigate('/42', { splitViewColumnName: 'secondary' }));

  expect(warn).toHaveBeenCalledTimes(1);
  expect(warn).toHaveBeenCalledWith(
    'No SplitView received the "secondary" column request from splitViewColumnName, because no SplitView is mounted. Remove splitViewColumnName, or navigate to a route inside a SplitView.'
  );
  warn.mockRestore();
});

it('does not warn when a column request navigates out of a SplitView', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  await renderRouter(
    {
      _layout: () => <Slot />,
      outside: () => <Text>Outside</Text>,
      '(split)/_layout': () => (
        <SplitView>
          <SplitView.Column />
          <SplitView.Content />
        </SplitView>
      ),
      '(split)/index': () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  await act(() => router.navigate('/outside', { splitViewColumnName: 'secondary' }));

  expect(warn).not.toHaveBeenCalled();
  warn.mockRestore();
});

it('does not warn when a Stack in a SplitView route handles router.push', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column />
          <SplitView.Content />
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
      'bluetooth/_layout': () => <Stack />,
      'bluetooth/index': () => <Text>Bluetooth</Text>,
      'bluetooth/[deviceId]': () => <Text>Device</Text>,
    },
    { initialUrl: '/bluetooth' }
  );

  await act(() => router.push('/bluetooth/123'));

  expect(warn).not.toHaveBeenCalled();
  warn.mockRestore();
});

it('warns when the SplitView handles router.push', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column />
          <SplitView.Content />
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
      '[mailId]': () => <Text>Mail</Text>,
    },
    { initialUrl: '/' }
  );

  await act(() => router.push('/42'));

  expect(warn).toHaveBeenCalledTimes(1);
  expect(warn).toHaveBeenCalledWith(
    'router.push and Link with push replace the current route in a SplitView, because SplitView keeps only the current route on iOS. Use router.navigate, router.replace, or Link without push.'
  );
  warn.mockRestore();
});

it('warns when the SplitView layout sets an anchor', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  await renderRouter(
    {
      _layout: {
        default: () => (
          <SplitView>
            <SplitView.Column />
            <SplitView.Content />
          </SplitView>
        ),
        unstable_settings: { anchor: 'index' },
      },
      index: () => <Text>Index</Text>,
      '[mailId]': () => <Text>Mail</Text>,
    },
    { initialUrl: '/42' }
  );

  expect(warn).toHaveBeenCalledTimes(1);
  expect(warn).toHaveBeenCalledWith(
    'The SplitView layout at "./_layout.js" sets the anchor "index", but SplitView keeps only the current route on iOS. The anchor applies only to the first navigation. Remove the anchor.'
  );
  warn.mockRestore();
});
