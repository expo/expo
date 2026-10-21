import { screen } from '@testing-library/react-native';
import { Children, isValidElement, type ComponentType, type ReactNode } from 'react';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { IsWithinNativeNavigator } from '../../exports';
import JSStack from '../../layouts/JSStack';
import Stack from '../../layouts/StackClient';
import { Split } from '../../optional-libraries/react-native-screens';
import { renderRouter } from '../../testing-library';
import { Slot } from '../../views/Navigator';
import { SplitView } from '../split-view';

jest.mock('../../optional-libraries/react-native-screens', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  const actual = jest.requireActual(
    '../../optional-libraries/react-native-screens'
  ) as typeof import('../../optional-libraries/react-native-screens');

  return {
    ...actual,
    Split: {
      ...actual.Split,
      Host: jest.fn(({ children }: { children?: ReactNode }) => (
        <View testID="Split.Host">{children}</View>
      )),
      Column: jest.fn(({ children }: { children?: ReactNode }) => (
        <View testID="Split.Column">{children}</View>
      )),
      Inspector: jest.fn(({ children }: { children?: ReactNode }) => (
        <View testID="Split.Inspector">{children}</View>
      )),
      // Column stacks and header configs come from react-native-screens v5.
      Stack: jest.fn(({ children }: { children?: ReactNode }) => <>{children}</>),
      HeaderConfig: jest.fn(() => <View testID="Split.HeaderConfig" />),
    },
  };
});

// The mock above adds the v5 column stack and header config, which the 4.x types do not declare.
const SplitV5 = Split as typeof Split & {
  Stack: ComponentType<{ children?: ReactNode }>;
  HeaderConfig: ComponentType<object>;
};

function getElementTypes(children: ReactNode) {
  return Children.toArray(children).map((child) => isValidElement(child) && child.type);
}

const SplitLayout = () => (
  <SplitView>
    <SplitView.Column />
  </SplitView>
);

it('renders a SplitView nested under Slot', async () => {
  await renderRouter(
    {
      _layout: () => <Slot />,
      'nested/_layout': SplitLayout,
      'nested/index': () => <Text testID="child">Child</Text>,
    },
    { initialUrl: '/nested' }
  );

  expect(screen.getByTestId('Split.Host')).toBeVisible();
  expect(screen.getByTestId('child')).toBeVisible();
});

it('renders a SplitView nested under the default navigator', async () => {
  await renderRouter(
    {
      'nested/_layout': SplitLayout,
      'nested/index': () => <Text testID="child">Child</Text>,
    },
    { initialUrl: '/nested' }
  );

  expect(screen.getByTestId('Split.Host')).toBeVisible();
  expect(screen.getByTestId('child')).toBeVisible();
});

it('rejects a SplitView nested under a native navigator', async () => {
  await expect(
    async () =>
      await renderRouter(
        {
          _layout: () => <Stack />,
          'nested/_layout': SplitLayout,
          'nested/index': () => <Text>Child</Text>,
        },
        { initialUrl: '/nested' }
      )
  ).rejects.toThrow('SplitView cannot be used inside another native navigator.');
});

it('rejects a SplitView nested under a custom native navigator', async () => {
  await expect(
    async () =>
      await renderRouter(
        {
          _layout: () => (
            <IsWithinNativeNavigator value>
              <Slot />
            </IsWithinNativeNavigator>
          ),
          'nested/_layout': SplitLayout,
          'nested/index': () => <Text>Child</Text>,
        },
        { initialUrl: '/nested' }
      )
  ).rejects.toThrow('SplitView cannot be used inside another native navigator.');
});

it('rejects a SplitView nested inside a SplitView column', async () => {
  await expect(
    async () =>
      await renderRouter({
        _layout: () => (
          <SplitView>
            <SplitView.Column>
              <SplitLayout />
            </SplitView.Column>
          </SplitView>
        ),
        index: () => <Text>Index</Text>,
      })
  ).rejects.toThrow('SplitView cannot be used inside another native navigator.');
});

it('renders a SplitView nested under a JavaScript navigator', async () => {
  await renderRouter(
    {
      _layout: () => <JSStack />,
      'nested/_layout': SplitLayout,
      'nested/index': () => <Text testID="child">Child</Text>,
    },
    { initialUrl: '/nested' }
  );

  expect(screen.getByTestId('Split.Host')).toBeVisible();
  expect(screen.getByTestId('child')).toBeVisible();
});

it('passes SplitView columns and inspectors to Split.Host as Split.Column and Split.Inspector', async () => {
  await renderRouter({
    _layout: () => (
      <SplitView>
        <SplitView.Column>
          <Text>Sidebar</Text>
        </SplitView.Column>
        <SplitView.Inspector>
          <Text>Inspector</Text>
        </SplitView.Inspector>
      </SplitView>
    ),
    index: () => <Text>Index</Text>,
  });

  // Split.Host counts columns and inspectors, and gives each column its index, by element type.
  const hostChildren = jest.mocked(Split.Host).mock.calls[0]![0].children;
  expect(getElementTypes(hostChildren)).toEqual([Split.Column, Split.Column, Split.Inspector]);
  expect(screen.getByText('Sidebar')).toBeVisible();
  expect(screen.getByText('Inspector')).toBeVisible();
});

it('renders a Split.Stack as the only child of its Split.Column', async () => {
  await renderRouter({
    _layout: () => (
      <SplitView>
        <SplitView.Column>
          <SplitV5.Stack>
            <Text>Sidebar</Text>
          </SplitV5.Stack>
        </SplitView.Column>
      </SplitView>
    ),
    index: () => <Text>Index</Text>,
  });

  // The first Split.Column call is the sidebar column, the second is the detail column.
  const sidebarChildren = jest.mocked(Split.Column).mock.calls[0]![0].children;
  expect(getElementTypes(sidebarChildren)).toEqual([SplitV5.Stack]);
  expect(screen.getByText('Sidebar')).toBeVisible();
});

it('renders a Split.HeaderConfig as a direct child of its Split.Column', async () => {
  await renderRouter({
    _layout: () => (
      <SplitView>
        <SplitView.Column>
          <SplitV5.HeaderConfig />
          <Text>Sidebar</Text>
        </SplitView.Column>
      </SplitView>
    ),
    index: () => <Text>Index</Text>,
  });

  // The first Split.Column call is the sidebar column, the second is the detail column.
  const sidebarChildren = jest.mocked(Split.Column).mock.calls[0]![0].children;
  expect(getElementTypes(sidebarChildren)).toEqual([SplitV5.HeaderConfig, SafeAreaProvider]);
  expect(screen.getByTestId('Split.HeaderConfig')).toBeVisible();
  expect(screen.getByText('Sidebar')).toBeVisible();
});
