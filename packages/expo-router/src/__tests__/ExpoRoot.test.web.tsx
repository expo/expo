/** @jest-environment node */

import { renderToString } from 'react-dom/server';
import { Text } from 'react-native';

import { ExpoRoot } from '../ExpoRoot';
import { getMockContext } from '../testing-library';

it('renders the document wrapper outside the navigation Suspense boundary', () => {
  // Like `@expo/router-server`, the wrapper renders the HTML document around the app.
  const html = renderToString(
    <ExpoRoot
      context={getMockContext({ index: () => <Text>Index</Text> })}
      location="/"
      wrapper={({ children }) => <div id="root">{children}</div>}
    />
  );

  expect(html).toMatch(/^<div id="root"><!--\$-->/);
});
