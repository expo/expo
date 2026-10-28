import type { ReactNode } from 'react';
import { Text } from 'react-native';

import { renderRouter } from '../../testing-library';
import { SplitView } from '../split-view';

// The missing SplitView.Content warning shows once per module instance, so these tests use their own test file.

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

const MISSING_CONTENT_WARNING =
  'SplitView.Content is missing. Add <SplitView.Content /> to SplitView to configure the content column.';

it('does not warn when SplitView.Content is present', async () => {
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
    },
    { initialUrl: '/' }
  );

  expect(warn).not.toHaveBeenCalled();
  warn.mockRestore();
});

it('warns once when SplitView.Content is missing', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const routes = {
    _layout: () => (
      <SplitView>
        <SplitView.Column />
      </SplitView>
    ),
    index: () => <Text>Index</Text>,
  };
  await renderRouter(routes, { initialUrl: '/' });
  await renderRouter(routes, { initialUrl: '/' });

  expect(warn).toHaveBeenCalledTimes(1);
  expect(warn).toHaveBeenCalledWith(MISSING_CONTENT_WARNING);
  warn.mockRestore();
});
