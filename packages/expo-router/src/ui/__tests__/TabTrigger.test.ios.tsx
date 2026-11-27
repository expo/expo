import { fireEvent, screen } from '@testing-library/react-native';
import { View } from 'react-native';

import { TabList, TabSlot, TabTrigger, Tabs } from '..';
import { renderRouter } from '../../testing-library';
import { Pressable } from '../../views/Pressable';

it('switches tabs and calls the asChild press handler', async () => {
  const onPress = jest.fn();
  await renderRouter(
    {
      _layout: () => (
        <Tabs>
          <TabList>
            <TabTrigger name="apple" href="/apple" />
            <TabTrigger asChild name="orange" href="/orange">
              <Pressable testID="orange-trigger" onPress={onPress} />
            </TabTrigger>
          </TabList>
          <TabSlot />
        </Tabs>
      ),
      apple: () => <View />,
      orange: () => <View />,
    },
    { initialUrl: '/apple' }
  );

  await fireEvent.press(screen.getByTestId('orange-trigger'));

  expect(onPress).toHaveBeenCalledTimes(1);
  expect(screen).toHaveSegments(['orange']);
});

it('forwards the href and merges style on an asChild view', async () => {
  await renderRouter(
    {
      _layout: () => (
        <Tabs>
          <TabList>
            <TabTrigger name="apple" href="/apple" />
            <TabTrigger asChild name="orange" href="/orange">
              <View testID="orange-trigger" style={{ padding: 4 }} />
            </TabTrigger>
          </TabList>
          <TabSlot />
        </Tabs>
      ),
      apple: () => <View />,
      orange: () => <View />,
    },
    { initialUrl: '/apple' }
  );

  const trigger = screen.getByTestId('orange-trigger');
  expect(trigger.props.href).toBe('/orange');
  expect(trigger.props.style).toEqual({
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 4,
  });
});
