/** @jest-environment jsdom */

import { Text } from 'react-native';

import { router } from '../imperative-api';
import Stack from '../layouts/Stack';
import { renderRouter, screen } from '../testing-library';

test('renders the initial URL with search params and a hash', () => {
  const Second = jest.fn(() => <Text>second</Text>);

  const result = renderRouter(
    {
      index: () => <Text>index</Text>,
      second: Second,
    },
    { initialUrl: '/second?x=1#hash' }
  );

  try {
    expect(Second).toHaveBeenCalled();
    expect(screen).toHavePathname('/second');
    expect(screen).toHaveSearchParams({ x: '1', '#': 'hash' });
  } finally {
    result.unmount();
    jest.useRealTimers();
  }
});

test('can dismiss an anchored initial stack state', () => {
  const result = renderRouter(
    {
      _layout: {
        unstable_settings: { initialRouteName: 'index' },
        default: () => <Stack />,
      },
      index: () => <Text>index</Text>,
      second: () => <Text>second</Text>,
    },
    { initialUrl: '/second' }
  );

  try {
    expect(router.canDismiss()).toBe(true);
  } finally {
    result.unmount();
    jest.useRealTimers();
  }
});
