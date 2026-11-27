import { Text } from 'react-native';

import { renderRouter } from '../../testing-library';
import { TabList, TabSlot, TabTrigger, Tabs } from '../index';

it('does not warn when the layout sets an anchor without a backBehavior', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

  try {
    await renderRouter(
      {
        _layout: {
          unstable_settings: { anchor: 'index' },
          default: () => (
            <Tabs>
              <TabList>
                <TabTrigger name="index" href="/" />
                <TabTrigger name="second" href="/second" />
              </TabList>
              <TabSlot />
            </Tabs>
          ),
        },
        index: () => <Text testID="index">Index</Text>,
        second: () => <Text testID="second">Second</Text>,
      },
      { initialUrl: '/second' }
    );

    expect(warn).not.toHaveBeenCalled();
  } finally {
    warn.mockRestore();
  }
});
