import React from 'react';
import { Text } from 'react-native';
import { TabList, TabSlot, TabTrigger, Tabs } from '../headless';
import { act, renderRouter, screen } from '../testing-library';
import { router } from '../imperative-api';

describe('initialRoute', () => {
  it('should respect `unstable_settings', () => {
    const render = (initialUrl: string) =>
      renderRouter(
        {
          '(one,two)/_layout': {
            unstable_settings: {
              initialRouteName: 'apple',
              two: {
                initialRouteName: 'orange',
              },
            },
            default: () => {
              return (
                <Tabs options={{ backBehavior: 'initialRoute' }}>
                  <TabList>
                    <TabTrigger href="/apple">
                      <Text>Apple</Text>
                    </TabTrigger>
                    <TabTrigger href="/banana">
                      <Text>Banana</Text>
                    </TabTrigger>
                    <TabTrigger href="/orange">
                      <Text>Orange</Text>
                    </TabTrigger>
                  </TabList>
                  <TabSlot />
                </Tabs>
              );
            },
          },
          '(one,two)/apple': () => <Text testID="apple"> Apple</Text>,
          '(two)/banana': () => <Text testID="banana">Banana</Text>,
          '(one,two)/orange': () => <Text testID="orange">Orange</Text>,
        },
        {
          initialUrl,
        }
      );

    render('/orange');

    expect(screen).toHaveSegments([]);

    expect(screen.getByTestId('orange')).toBeVisible();
    act(() => router.back());
    expect(screen.getByTestId('apple')).toBeVisible();

    debugger;

    // Reset the app, but start at /banana
    screen.unmount();
    render('/banana');

    // Oranage should be the initialRouteName, because we are now in (two)
    expect(screen.getByTestId('banana')).toBeVisible();
    act(() => router.back());
    expect(screen.getByTestId('orange')).toBeVisible();
  });
});
