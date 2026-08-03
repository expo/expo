import { screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { Navigator, Slot } from '../index';
import { withLayoutContext } from '../layouts/withLayoutContext';
import type { TabRouterOptions } from '../react-navigation/native';
import { TabRouter } from '../react-navigation/native';
import { createStackNavigator } from '../react-navigation/stack';
import { renderRouter } from '../testing-library';

const StackNavigator = createStackNavigator().Navigator;

function renderProcessedScreens(
  processScreens: NonNullable<Parameters<typeof withLayoutContext>[1]>
) {
  const CustomNavigator = withLayoutContext(StackNavigator, processScreens);

  return renderRouter({
    _layout: () => (
      <CustomNavigator>
        <CustomNavigator.Screen name="index" />
        <CustomNavigator.Screen name="two" />
      </CustomNavigator>
    ),
    index: () => <Text testID="index" />,
    two: () => <Text testID="two" />,
  });
}

it('can render a custom navigator', () => {
  // The default <Stack /> doesn't have any routerOptions, so we use TabRouter
  // to check that the routerOption types are correct
  const customRouter = jest.fn((options: TabRouterOptions) => {
    return TabRouter(options);
  });

  renderRouter({
    '(app)/_layout': {
      unstable_settings: {
        initialRouteName: 'two',
      },
      default: () => (
        <Navigator router={customRouter} routerOptions={{ backBehavior: 'history' }}>
          <Slot />
        </Navigator>
      ),
    },
    '(app)/index': () => <Text testID="index">Hello, world</Text>,
    '(app)/two': () => <Text testID="two" />,
  });

  expect(screen.getByTestId('index')).toBeVisible();
  expect(customRouter).toHaveBeenCalledWith({
    id: '/(app)',
    backBehavior: 'history',
    initialRouteName: undefined,
  });
});

it.each([
  ['adds a screen', (screens) => [...screens, { ...screens[0]!, name: 'three' }]],
  ['removes a screen', (screens) => screens.slice(1)],
  ['renames a screen', (screens) => [{ ...screens[0]!, name: 'three' }, screens[1]!]],
  ['duplicates and removes a screen', (screens) => [screens[0]!, screens[0]!]],
  ['adds a duplicate screen', (screens) => [screens[0]!, screens[0]!, screens[1]!]],
] satisfies [string, NonNullable<Parameters<typeof withLayoutContext>[1]>][])(
  '%s',
  (_, processScreens) => {
    expect(() => renderProcessedScreens(processScreens)).toThrow(
      '`processScreens` must not add, remove, rename, or duplicate screens.'
    );
  }
);

it('allows processScreens to update screen options', () => {
  expect(() =>
    renderProcessedScreens((screens) =>
      screens.map((screen) => {
        if (
          typeof screen.options !== 'function' &&
          screen.options &&
          'customOption' in screen.options
        ) {
          return screen;
        }
        return { ...screen, options: { customOption: true } };
      })
    )
  ).not.toThrow();
});

it('allows processScreens to reorder screens', () => {
  expect(() => renderProcessedScreens((screens) => [...screens].reverse())).not.toThrow();
});

it('preserves the fallback for a nullish processScreens result', () => {
  expect(() => renderProcessedScreens(() => undefined as never)).not.toThrow();
});
