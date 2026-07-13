import { screen, userEvent, waitFor } from '@testing-library/react-native';
import { Pressable, Text, View } from 'react-native';

import { renderRouter } from '../../testing-library';
import { TopTabs } from '../TopTabs';

const MockTabBar = jest.fn(
  ({ navigationState, onTabPress, options, jumpTo }: any) => (
    <View>
      {navigationState.routes.map((route: any) => (
        <Pressable
          key={route.key}
          testID={`tab-${route.name}`}
          onPress={() => {
            onTabPress({ route, preventDefault: () => {} });
            jumpTo(route.key);
          }}
        >
          <Text>{options?.[route.key]?.labelText ?? route.name}</Text>
        </Pressable>
      ))}
    </View>
  )
);

jest.mock('react-native-pager-view', () => {
  const React = require('react');
  const { View } = require('react-native');

  return class ViewPager extends React.Component<React.PropsWithChildren> {
    setPage() {}

    render() {
      return <View>{this.props.children}</View>;
    }
  };
});

jest.mock(
  'react-native-tab-view',
  () => {
    const { View } = require('react-native');

    return {
      TabView: ({
        navigationState,
        onIndexChange,
        renderScene,
        renderTabBar,
      }: any) => (
        <View>
          {renderTabBar({
            navigationState,
            options: {},
            jumpTo: (key: string) => {
              const index = navigationState.routes.findIndex(
                (route: any) => route.key === key
              );
              onIndexChange(index);
            },
          })}
          {renderScene({
            route: navigationState.routes[navigationState.index],
            position: { interpolate: () => 0 },
          })}
        </View>
      ),
      TabBar: (props: any) => MockTabBar(props),
      TabBarIndicator: () => null,
    };
  },
  { virtual: true }
);

beforeEach(() => {
  MockTabBar.mockClear();
});

it('renders the public top tabs entry and changes tabs', async () => {
  renderRouter({
    _layout: () => (
      <TopTabs>
        <TopTabs.Screen
          name="index"
          options={{ title: 'Home tab', swipeEnabled: false }}
        />
        <TopTabs.Screen name="settings" options={{ title: 'Settings tab' }} />
      </TopTabs>
    ),
    index: () => <Text testID="home">Home</Text>,
    settings: () => <Text testID="settings">Settings</Text>,
  });

  expect(screen.getByTestId('home')).toBeVisible();
  expect(screen.getByText('Home tab')).toBeVisible();

  await userEvent.press(screen.getByTestId('tab-settings'));

  await waitFor(() => expect(screen.getByTestId('settings')).toBeVisible());
});
