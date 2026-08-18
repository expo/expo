import { act, fireEvent, screen } from '@testing-library/react-native';
import type { ComponentProps } from 'react';
import { Text } from 'react-native';

import { Navigator, Slot } from '../index';
import JSStack from '../layouts/JSStack';
import { Tabs } from '../layouts/Tabs';
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
        <Navigator
          router={customRouter}
          routerOptions={{ backBehavior: 'history' }}
          // @ts-expect-error `initialRouteName` is only supported through `unstable_settings`.
          initialRouteName="index">
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
    initialRouteName: 'two',
  });
});

// The casts simulate stale props supplied by untyped JavaScript.
it.each([
  ['Slot', () => <Slot {...({ initialRouteName: 'index' } as ComponentProps<typeof Slot>)} />],
  [
    'JS Stack',
    () => <JSStack {...({ initialRouteName: 'index' } as ComponentProps<typeof JSStack>)} />,
  ],
])('%s uses the configured anchor instead of a stale JavaScript prop', (_, Layout) => {
  renderRouter({
    _layout: () => (
      <Tabs>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="inner" />
      </Tabs>
    ),
    index: () => <Text testID="root-index" />,
    'inner/_layout': {
      unstable_settings: { initialRouteName: 'two' },
      default: () => <Layout />,
    },
    'inner/index': () => <Text testID="index" />,
    'inner/two': () => <Text testID="two" />,
  });

  act(() => fireEvent.press(screen.getByLabelText('inner, tab, 2 of 2')));

  expect(screen.getByTestId('two')).toBeVisible();
});

it('honors the configured anchor when screens are explicitly declared', () => {
  renderRouter({
    _layout: () => (
      <Tabs>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="inner" />
      </Tabs>
    ),
    index: () => <Text testID="root-index" />,
    'inner/_layout': {
      unstable_settings: { initialRouteName: 'two' },
      default: () => (
        <Navigator>
          <Navigator.Screen name="index" />
          <Navigator.Screen name="two" />
          <Slot />
        </Navigator>
      ),
    },
    'inner/index': () => <Text testID="index" />,
    'inner/two': () => <Text testID="two" />,
  });

  act(() => fireEvent.press(screen.getByLabelText('inner, tab, 2 of 2')));

  expect(screen.getByTestId('two')).toBeVisible();
});

it('throws for an invalid configured anchor', () => {
  expect(() =>
    renderRouter(
      {
        _layout: () => (
          <Tabs>
            <Tabs.Screen name="index" />
            <Tabs.Screen name="inner" />
          </Tabs>
        ),
        index: () => <Text testID="root-index" />,
        'inner/_layout': {
          unstable_settings: { initialRouteName: 'missing' },
          default: () => <Navigator />,
        },
        'inner/index': () => <Text testID="index" />,
        'inner/two': () => <Text testID="two" />,
      },
      { initialUrl: '/inner' }
    )
  ).toThrow(
    'The initial route name "missing" was not found in the layout at "./inner/_layout.js". Available routes are: "index", "two". Set `unstable_settings.initialRouteName` to the name of a route in this layout.'
  );
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
