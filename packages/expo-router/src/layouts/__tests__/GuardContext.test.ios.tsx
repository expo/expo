import { render } from '@testing-library/react-native';

import { GuardContextProvider } from '../GuardContext';

it('throws when a navigator has no route node', async () => {
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  await expect(
    render(
      <GuardContextProvider node={null} guardedRedirects={new Map([['secret', undefined]])}>
        {null}
      </GuardContextProvider>
    )
  ).rejects.toThrow(
    'Expo Router could not find the route of this navigator, so it cannot choose a fallback for protected routes. ' +
      'Render the navigator in a `_layout` file. If it is already in a `_layout` file, report this as a bug in Expo Router.'
  );

  errorSpy.mockRestore();
});
