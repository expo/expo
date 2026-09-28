/** @jest-environment jsdom */
import { Text } from 'react-native';

import { router } from '../../../imperative-api';
import { Stack } from '../../../layouts/Stack';
import { Tabs } from '../../../layouts/Tabs';
import { act, renderRouter, screen } from '../../../testing-library';

/** Whether any element between `testID` and the root is marked `inert` or `aria-hidden`. */
function getHiddenProps(testID: string) {
  const hiddenProps = { inert: false, ariaHidden: false };
  let node = screen.UNSAFE_getByProps({ testID });

  while (node.parent) {
    node = node.parent;
    if (node.props.inert === true) {
      hiddenProps.inert = true;
    }
    if (node.props['aria-hidden'] === true) {
      hiddenProps.ariaHidden = true;
    }
  }

  return hiddenProps;
}

it('marks the stack screen the user left as inert instead of aria-hidden', () => {
  const result = renderRouter({
    _layout: () => <Stack />,
    index: () => <Text testID="index">Index</Text>,
    second: () => <Text testID="second">Second</Text>,
  });

  try {
    act(() => router.push('/second'));

    expect(getHiddenProps('index')).toEqual({ inert: true, ariaHidden: false });
    expect(getHiddenProps('second')).toEqual({ inert: false, ariaHidden: false });
  } finally {
    result.unmount();
    jest.useRealTimers();
  }
});

it('marks the tab the user left as inert instead of aria-hidden', () => {
  const result = renderRouter({
    _layout: () => (
      <Tabs>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="second" />
      </Tabs>
    ),
    index: () => <Text testID="index">Index</Text>,
    second: () => <Text testID="second">Second</Text>,
  });

  try {
    act(() => router.push('/second'));

    expect(getHiddenProps('index')).toEqual({ inert: true, ariaHidden: false });
    expect(getHiddenProps('second')).toEqual({ inert: false, ariaHidden: false });
  } finally {
    result.unmount();
    jest.useRealTimers();
  }
});
