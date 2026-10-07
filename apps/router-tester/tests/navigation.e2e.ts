import { test } from './fixtures';
import { expect } from 'e2e';

test('shows the home screen', async ({ app, platform, screen }) => {
  await app.open();

  // Each platform leaves different nodes out of the accessibility tree: iOS hides the links that
  // use `Link.Preview`, and Android hides the title under the status bar.
  const visibleText = platform === 'ios' ? 'Native navigation - Index' : 'Native Tabs';
  await expect(screen.getByText(visibleText)).toBeVisible();
});

// The home screen links use `Link.Preview`, which hides them from the iOS accessibility tree.
test('opens native tabs from a deep link', async ({ openLink, screen }) => {
  await openLink('router-tester://tabs');

  await expect(screen.getByText('Index screen')).toBeVisible();
  await expect(screen.getByText('Index tab')).toBeVisible();
});

test('opens a dynamic route', async ({ openLink, screen }) => {
  await openLink('router-tester://params');

  await screen.getByText('/params/123').tap();

  await expect(screen.getByText('Param: {"path":"123"}')).toBeVisible();
});
