import { Pressable, Text } from 'react-native';

import { router } from '../imperative-api';
import { Stack } from '../layouts/Stack';
import { act, fireEvent, renderRouter, screen } from '../testing-library';
import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from '../ui';

it('does not rerender tab buttons when a covering stack changes', async () => {
  const renderButton = jest.fn();
  function TabButton({ isFocused, ...props }: TabTriggerSlotProps) {
    renderButton();
    return <Pressable {...props} accessibilityState={{ selected: isFocused }} />;
  }

  await renderRouter(
    {
      _layout: () => <Stack />,
      '(tabs)/_layout': () => (
        <Tabs>
          <TabSlot />
          <TabList>
            <TabTrigger name="index" href="/" asChild>
              <TabButton testID="home-trigger">
                <Text>Home</Text>
              </TabButton>
            </TabTrigger>
            <TabTrigger name="explore" href="/explore" asChild>
              <TabButton testID="explore-trigger">
                <Text>Explore</Text>
              </TabButton>
            </TabTrigger>
          </TabList>
        </Tabs>
      ),
      '(tabs)/index': () => <Text testID="home">Home</Text>,
      '(tabs)/explore': () => <Text testID="explore">Explore</Text>,
      'details/[id]': () => <Text testID="details">Details</Text>,
    },
    { initialUrl: '/' }
  );

  expect(renderButton).toHaveBeenCalledTimes(2);
  await act(() => router.push('/details/1?user=bob'));
  expect(screen).toHavePathname('/details/1');
  expect(renderButton).toHaveBeenCalledTimes(2);
  await act(() => router.push('/details/2?user=bob'));
  expect(screen).toHavePathname('/details/2');
  expect(renderButton).toHaveBeenCalledTimes(2);
  await act(() => router.push('/details/3?user=bob'));
  expect(screen).toHavePathname('/details/3');
  expect(renderButton).toHaveBeenCalledTimes(2);
  await act(() => router.back());
  expect(screen).toHavePathname('/details/2');
  expect(renderButton).toHaveBeenCalledTimes(2);
  await act(() => router.back());
  expect(screen).toHavePathname('/details/1');
  expect(renderButton).toHaveBeenCalledTimes(2);
  await act(() => router.back());
  await fireEvent.press(screen.getByTestId('explore-trigger'));
  expect(screen).toHavePathname('/explore');
  expect(screen.getByTestId('explore')).toBeVisible();
});

it('keeps relative tab links local while a stack covers the tabs', async () => {
  const renderButton = jest.fn();
  function TabButton({ isFocused, ...props }: TabTriggerSlotProps) {
    renderButton();
    return <Pressable {...props} accessibilityState={{ selected: isFocused }} />;
  }

  await renderRouter(
    {
      _layout: () => <Stack />,
      '[user]/(tabs)/_layout': () => (
        <Tabs>
          <TabSlot />
          <TabList>
            <TabTrigger name="index" href="./" asChild>
              <TabButton testID="home-trigger">
                <Text>Home</Text>
              </TabButton>
            </TabTrigger>
            <TabTrigger name="explore" href="./explore" asChild>
              <TabButton testID="explore-trigger">
                <Text>Explore</Text>
              </TabButton>
            </TabTrigger>
          </TabList>
        </Tabs>
      ),
      '[user]/(tabs)/index': () => <Text testID="home">Home</Text>,
      '[user]/(tabs)/explore': () => <Text testID="explore">Explore</Text>,
      'details/[id]': () => <Text testID="details">Details</Text>,
    },
    { initialUrl: '/alice' }
  );

  expect(renderButton).toHaveBeenCalledTimes(2);
  await act(() => router.push('/details/1?user=bob'));
  expect(screen).toHavePathname('/details/1');
  expect(renderButton).toHaveBeenCalledTimes(2);
  await act(() => router.push('/details/2?user=bob'));
  expect(screen).toHavePathname('/details/2');
  expect(renderButton).toHaveBeenCalledTimes(2);
  await act(() => router.push('/details/3?user=bob'));
  expect(screen).toHavePathname('/details/3');
  expect(renderButton).toHaveBeenCalledTimes(2);
  await act(() => router.back());
  expect(screen).toHavePathname('/details/2');
  expect(renderButton).toHaveBeenCalledTimes(2);
  await act(() => router.back());
  expect(screen).toHavePathname('/details/1');
  expect(renderButton).toHaveBeenCalledTimes(2);
  await act(() => router.back());
  await fireEvent.press(screen.getByTestId('explore-trigger'));
  expect(screen).toHavePathname('/alice/explore');
  expect(screen.getByTestId('explore')).toBeVisible();
  await act(() => router.setParams({ user: 'carol' }));
  expect(screen).toHavePathname('/carol/explore');
  await fireEvent.press(screen.getByTestId('home-trigger'));
  expect(screen).toHavePathname('/carol');
});
