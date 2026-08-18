import { Text } from 'react-native';

import { renderRouter, screen } from '../testing-library';

const webTest = typeof window === 'undefined' ? test.skip : test;

webTest('renders the initial URL with search params and a hash', () => {
  const Second = jest.fn(() => <Text>second</Text>);

  const result = renderRouter(
    {
      index: () => <Text>index</Text>,
      second: Second,
    },
    { initialUrl: '/second?x=1#hash' }
  );

  expect(Second).toHaveBeenCalled();
  expect(screen).toHavePathname('/second');
  expect(screen).toHaveSearchParams({ x: '1', '#': 'hash' });

  result.unmount();
  jest.useRealTimers();
});
