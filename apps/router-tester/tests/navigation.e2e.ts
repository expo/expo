import { test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

test('shows the home screen', async ({ app, screen }) => {
  await app.open();

  await expect(screen.getByText('Native navigation - Index')).toBeVisible();
  await expect(screen.getByText('Current Path: /')).toBeVisible();
});

// The home screen links use `Link.Preview`, which hides them from the iOS accessibility tree.
test('opens native tabs from a deep link', async ({ app, device, screen }) => {
  await app.open();

  await device.openLink('router-tester://tabs');

  await expect(screen.getByText('Index screen')).toBeVisible();
  await expect(screen.getByText('Index tab')).toBeVisible();
});

test('opens a dynamic route', async ({ app, device, screen }) => {
  await app.open();
  await device.openLink('router-tester://params');

  await screen.getByText('/params/123').tap();

  await expect(screen.getByText('Param: {"path":"123"}')).toBeVisible();
});
