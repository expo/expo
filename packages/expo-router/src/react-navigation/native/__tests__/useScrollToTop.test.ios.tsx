import { act, fireEvent, screen } from '@testing-library/react-native';
import { useRef } from 'react';
import { Text } from 'react-native';

import { useScrollToTop } from '../useScrollToTop';
import { router } from '../../../imperative-api';
import Stack from '../../../layouts/StackClient';
import Tabs from '../../../layouts/Tabs';
import { renderRouter } from '../../../testing-library';

// Registers `useScrollToTop` with a fake scrollable and exposes its `scrollTo` spy.
function makeScreen(scrollTo: jest.Mock) {
  return function ScrollScreen() {
    const ref = useRef({ scrollTo });
    useScrollToTop(ref);
    return <Text>screen</Text>;
  };
}

let rafSpy: jest.SpyInstance;
beforeEach(() => {
  // Run scroll work synchronously so we can assert right after the tab press.
  rafSpy = jest.spyOn(global, 'requestAnimationFrame').mockImplementation((cb) => {
    cb(0);
    return 0 as unknown as number;
  });
});
afterEach(() => {
  rafSpy.mockRestore();
});

it('scrolls to top on tab press when the nested stack is on its first screen', () => {
  const scrollTo = jest.fn();
  renderRouter(
    {
      _layout: () => <Tabs />,
      index: () => <Text>index</Text>,
      'nested/_layout': () => <Stack />,
      'nested/a': makeScreen(scrollTo),
    },
    { initialUrl: '/nested/a' }
  );

  act(() => fireEvent.press(screen.getByLabelText('nested, tab, 2 of 2')));

  expect(scrollTo).toHaveBeenCalled();
});

it('does not scroll to top on tab press when the nested stack is not on its first screen', () => {
  const scrollTo = jest.fn();
  renderRouter(
    {
      _layout: () => <Tabs />,
      index: () => <Text>index</Text>,
      'nested/_layout': () => <Stack />,
      'nested/a': () => <Text>a</Text>,
      'nested/b': makeScreen(scrollTo),
    },
    { initialUrl: '/nested/a' }
  );

  act(() => router.push('/nested/b'));

  act(() => fireEvent.press(screen.getByLabelText('nested, tab, 2 of 2')));

  expect(scrollTo).not.toHaveBeenCalled();
});
