import { act, screen } from '@testing-library/react-native';
import { Text, type NativeSyntheticEvent } from 'react-native';
import {
  Tabs,
  type TabSelectedEvent,
  type TabsHostProps,
  // @ts-expect-error: method is declared in mock below
  __triggerTabSelected,
} from 'react-native-screens';

import Stack from '../layouts/Stack';
import { NativeTabs } from '../native-tabs/NativeTabs';
import { renderRouter } from '../testing-library';
import { lazyModule } from './lazyModule';

jest.mock('react-native-screens', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  const actualModule = jest.requireActual(
    'react-native-screens'
  ) as typeof import('react-native-screens');
  let triggerTabSelected: NonNullable<TabsHostProps['onTabSelected']> = () => {};
  return {
    ...actualModule,
    Tabs: {
      ...actualModule.Tabs,
      Host: jest.fn(({ children, onTabSelected }) => {
        triggerTabSelected = onTabSelected || (() => {});
        return <View testID="TabsHost">{children}</View>;
      }),
      Screen: jest.fn(({ children }) => <View testID="TabsScreen">{children}</View>),
    },
    __triggerTabSelected: (event: Parameters<NonNullable<TabsHostProps['onTabSelected']>>[0]) =>
      triggerTabSelected(event),
  };
});

const TabsScreen = Tabs.Screen as jest.MockedFunction<typeof Tabs.Screen>;
const originalImportMode = process.env.EXPO_ROUTER_IMPORT_MODE;
beforeEach(() => {
  process.env.EXPO_ROUTER_IMPORT_MODE = 'lazy';
});
afterEach(() => {
  process.env.EXPO_ROUTER_IMPORT_MODE = originalImportMode;
});

it('uses the anchor of a lazy tab layout on a native tab press', async () => {
  const warn = jest.spyOn(console, 'warn');
  const layout = lazyModule(
    { unstable_settings: { anchor: 'b' }, default: () => <Stack /> },
    { native: true }
  );
  await renderRouter({
    _layout: () => (
      <NativeTabs>
        <NativeTabs.Trigger name="index" />
        <NativeTabs.Trigger name="profile" />
      </NativeTabs>
    ),
    index: () => <Text testID="index" />,
    'profile/_layout': layout.load,
    'profile/a': () => <Text testID="a" />,
    'profile/b': () => <Text testID="b" />,
  });
  await act(async () => layout.resolve());

  const profileKey = TabsScreen.mock.calls.at(-1)![0].screenKey;
  await act(() => {
    __triggerTabSelected({
      nativeEvent: {
        selectedScreenKey: profileKey,
        provenance: 0,
        isRepeated: false,
        hasTriggeredSpecialEffect: false,
        actionOrigin: 'user',
      },
    } as NativeSyntheticEvent<TabSelectedEvent>);
  });

  expect(screen.getByTestId('b')).toBeVisible();
  expect(warn).not.toHaveBeenCalled();
  warn.mockRestore();
});
