/** @jest-environment jsdom */
import { render } from '@testing-library/react';

import { ExpoRoot } from '../../../ExpoRoot';
import { Tabs } from '../../../layouts/Tabs';
import { getMockContext } from '../../../testing-library/mock-config';

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as typeof ResizeObserver;

test('tab bars render appropriate hrefs', () => {
  const hrefs: (string | undefined)[] = [];

  process.env.EXPO_ROUTER_IMPORT_MODE = 'sync';
  const context = getMockContext({
    _layout: () => (
      <Tabs
        screenOptions={{
          tabBarButton: ({ href }) => {
            hrefs.push(href);
            return null;
          },
        }}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="nested/second" />
      </Tabs>
    ),
    index: () => null,
    'nested/second': () => null,
  });
  render(<ExpoRoot context={context} location="/" />);

  expect(hrefs).toEqual(['/', '/nested/second']);
});
