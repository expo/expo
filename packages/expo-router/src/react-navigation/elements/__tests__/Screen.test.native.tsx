import { act, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { router } from '../../../imperative-api';
import { Tabs } from '../../../layouts/Tabs';
import { renderRouter } from '../../../testing-library';

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

it('keeps aria-hidden on the tab the user left', () => {
  renderRouter({
    _layout: () => (
      <Tabs>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="second" />
      </Tabs>
    ),
    index: () => <Text testID="index">Index</Text>,
    second: () => <Text testID="second">Second</Text>,
  });

  act(() => router.push('/second'));
  expect(screen.getByTestId('second')).toBeVisible();

  expect(getHiddenProps('index')).toEqual({ inert: false, ariaHidden: true });
  expect(getHiddenProps('second')).toEqual({ inert: false, ariaHidden: false });
});
