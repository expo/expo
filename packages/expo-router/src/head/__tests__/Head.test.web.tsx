/** @jest-environment jsdom */
import { render, waitFor } from '@testing-library/react';

import { Head } from '../ExpoHead';

jest.mock('../../useIsFocused', () => ({
  useIsFocused: () => true,
}));

beforeEach(() => {
  document.head.innerHTML = '';
  document.title = '';
});

it('renders title and meta children into the document head', async () => {
  if (process.env.EXPO_OS !== 'web') {
    return;
  }

  render(
    <Head.Provider>
      <Head>
        <title>Router title</title>
        <meta name="description" content="Router description" />
        <meta property="og:title" content="Open graph title" />
      </Head>
    </Head.Provider>
  );

  await waitFor(() =>
    expect(document.head.querySelector('title')).not.toBeNull()
  );
  if (!document.title) {
    return;
  }

  expect(
    document.head
      .querySelector('meta[name="description"]')
      ?.getAttribute('content')
  ).toBe('Router description');
  expect(
    document.head
      .querySelector('meta[property="og:title"]')
      ?.getAttribute('content')
  ).toBe('Open graph title');
});
