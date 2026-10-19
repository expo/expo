/** @jest-environment jsdom */

import { View } from 'react-native';

import { renderRouter, screen } from '../testing-library';

test('renders the initial URL with search params and a hash', async () => {
  const Second = jest.fn(() => <View testID="second" />);

  const result = await renderRouter(
    {
      index: () => <View testID="index" />,
      second: Second,
    },
    { initialUrl: '/second?x=1#hash' }
  );

  try {
    expect(Second).toHaveBeenCalled();
    expect(screen).toHavePathname('/second');
    expect(screen).toHaveSearchParams({ x: '1', '#': 'hash' });
  } finally {
    await result.unmount();
    jest.useRealTimers();
  }
});
