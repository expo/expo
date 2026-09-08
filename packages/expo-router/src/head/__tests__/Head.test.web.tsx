/** @jest-environment jsdom */
import { render, waitFor } from '@testing-library/react';
import type { ComponentProps } from 'react';

import { Head } from '../ExpoHead';

jest.mock('../../useIsFocused', () => ({
  useIsFocused: () => true,
}));

beforeEach(() => {
  document.head.innerHTML = '';
});

it('renders title and meta children for client and server web environments', async () => {
  const helmetContext: NonNullable<ComponentProps<typeof Head.Provider>['context']> = {};

  render(
    <Head.Provider context={helmetContext}>
      <Head>
        <title>Router title</title>
        <meta name="description" content="Router description" />
        <meta property="og:title" content="Open graph title" />
      </Head>
    </Head.Provider>
  );

  if (helmetContext.helmet) {
    expect(helmetContext.helmet.title.toString()).toContain('Router title');
    expect(helmetContext.helmet.meta.toString()).toContain('Router description');
    expect(helmetContext.helmet.meta.toString()).toContain('Open graph title');
    return;
  }

  await waitFor(() => expect(document.title).toBe('Router title'));

  expect(document.head.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
    'Router description'
  );
  expect(document.head.querySelector('meta[property="og:title"]')?.getAttribute('content')).toBe(
    'Open graph title'
  );
});
