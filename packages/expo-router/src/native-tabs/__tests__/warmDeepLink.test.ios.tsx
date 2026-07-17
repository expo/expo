import { screen, act } from '@testing-library/react-native';
import { Text } from 'react-native';

import { Stack } from '../../layouts/Stack';
import { renderRouter } from '../../testing-library';
import { NativeTabs } from '../NativeTabs';

// Capture the OS `url` listener so a test can fire a warm deep link (the default testing-library mock
// stubs `addEventListener` to a no-op, which is why the jest suite can't otherwise see this path).
let urlListener: ((event: { url: string }) => void) | undefined;

jest.mock('expo-linking', () => ({
  ...jest.requireActual('expo-linking'),
  createURL: (path: string) => 'router-e2e://' + path,
  resolveScheme: () => 'router-e2e',
  addEventListener: (type: string, callback: (event: { url: string }) => void) => {
    if (type === 'url') {
      urlListener = callback;
    }
    return { remove() {} };
  },
}));

jest.mock('react-native-screens', () => {
  const { View: RNView }: typeof import('react-native') = jest.requireActual('react-native');
  const actualModule = jest.requireActual(
    'react-native-screens'
  ) as typeof import('react-native-screens');
  return {
    ...actualModule,
    Tabs: {
      ...actualModule.Tabs,
      Host: jest.fn(({ children }) => <RNView testID="TabsHost">{children}</RNView>),
      Screen: jest.fn(({ children }) => <RNView testID="TabsScreen">{children}</RNView>),
    },
  };
});

beforeEach(() => {
  urlListener = undefined;
});

const app = {
  _layout: () => <Stack screenOptions={{ headerShown: false }} />,
  index: () => <Text testID="home">Home</Text>,
  'tabs/_layout': () => (
    <NativeTabs>
      <NativeTabs.Trigger name="index" />
      <NativeTabs.Trigger name="faces" />
      <NativeTabs.Trigger name="dynamic" />
    </NativeTabs>
  ),
  'tabs/index': () => <Text testID="tabs-index">Tabs Index</Text>,
  'tabs/dynamic': () => <Text testID="tabs-dynamic">Tabs Dynamic</Text>,
  'tabs/faces/_layout': () => <Stack />,
  'tabs/faces/index': () => <Text testID="faces-index">Faces Index</Text>,
  'tabs/faces/[face]': () => <Text testID="face">Face</Text>,
};

// Guards the getInitialState/self-seed removal (Step 6): a warm OS deep link into a not-yet-mounted
// nested navigator (root Stack → NativeTabs → faces Stack → [face]) must commit every slice on the
// path, not leave the NativeTabs level mounting with a `null` slice.
test('warm OS deep-link into a nested stack tab of NativeTabs does not crash', () => {
  const useScreens = require('react-native-screens');
  useScreens.Tabs.Screen.mockClear();

  renderRouter(app, { initialUrl: '/' });

  expect(screen.getByTestId('home')).toBeVisible();
  expect(urlListener).toBeDefined();

  act(() => {
    urlListener!({ url: 'router-e2e:///tabs/faces/1' });
  });

  expect(screen).toHaveSegments(['tabs', 'faces', '[face]']);
});
