/** @jest-environment jsdom */

import { act } from '@testing-library/react-native';
import { View } from 'react-native';

import { router } from '../imperative-api';
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

test.each([[['a?b c', '50%', 'd#e']], ['a?b c/50%/d#e']])(
  'reloads a catch-all URL with reserved characters to the same params (%j)',
  async (slug) => {
    const routes = {
      index: () => <View testID="index" />,
      'blog/[...slug]': () => <View testID="blog" />,
    };

    const first = await renderRouter(routes);
    let url: string;
    try {
      await act(() => router.push({ pathname: '/blog/[...slug]', params: { slug } }));
      url = window.location.pathname + window.location.search + window.location.hash;
      expect(url).toBe('/blog/a%3Fb%20c/50%25/d%23e');
    } finally {
      await first.unmount();
      window.history.replaceState(null, '', '/');
      jest.useRealTimers();
    }

    // A reload parses the URL from the address bar back into params.
    const second = await renderRouter(routes, { initialUrl: url });
    try {
      expect(screen).toHaveSegments(['blog', '[...slug]']);
      expect(screen).toHaveSearchParams({ slug: ['a?b c', '50%', 'd#e'] });
    } finally {
      await second.unmount();
      jest.useRealTimers();
    }
  }
);
