import { expect, test } from '@playwright/test';

import { getRouterE2ERoot } from '../../__tests__/utils';
import { createExpoStart } from '../../utils/expo';
import { pageCollectErrors } from '../page';

const projectRoot = getRouterE2ERoot();

test.describe('react-native-web fork', () => {
  test.describe.configure({ mode: 'serial' });

  const expoStart = createExpoStart({
    cwd: projectRoot,
    env: {
      CI: '0',
      E2E_ROUTER_SRC: 'react-native-web',
      EXPO_USE_STATIC: 'single',
    },
  });

  test.beforeAll(async () => {
    await expoStart.startAsync();
    await expoStart.fetchBundleAsync('/');
  });

  test.afterAll(async () => {
    await expoStart.stopAsync();
  });

  test.beforeEach(async ({ page }) => {
    const pageErrors = pageCollectErrors(page);
    await page.goto(expoStart.url.href);
    await expect(page.getByTestId('heading')).toHaveText('React Native Web compatibility');
    expect(pageErrors.all).toEqual([]);
  });

  test('renders styles and handles keyboard, text, and switch input', async ({ page }) => {
    await expect(page.getByTestId('heading')).toHaveCSS('color', 'rgb(20, 40, 80)');

    const increment = page.getByRole('button', { name: 'Increment' });
    await increment.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('press-count')).toHaveText('Press count: 1');

    await page.getByRole('textbox', { name: 'Message' }).fill('browser input');
    await expect(page.getByTestId('input-value')).toHaveText('Input: browser input');

    const toggle = page.getByRole('switch', { name: 'Feature enabled' });
    await toggle.click();
    await expect(toggle).toBeChecked();
    await expect(page.getByTestId('switch-value')).toHaveText('Switch: on');
  });

  test('runs JavaScript-driven animations', async ({ page }) => {
    await expect(page.getByTestId('animated-box')).toHaveCSS('opacity', '0.2');
    await page.getByRole('button', { name: 'Animate' }).click();
    await expect(page.getByTestId('animation-state')).toHaveText('Animation: finished');
    await expect(page.getByTestId('animated-box')).toHaveCSS('opacity', '1');
  });

  test('tracks pointer gestures through PanResponder', async ({ page }) => {
    const target = page.getByTestId('pan-target');
    const bounds = await target.boundingBox();
    expect(bounds).not.toBeNull();

    await page.mouse.move(bounds!.x + 20, bounds!.y + 20);
    await page.mouse.down();
    await page.mouse.move(bounds!.x + 70, bounds!.y + 50, { steps: 4 });
    await page.mouse.up();

    await expect(page.getByTestId('pan-delta')).not.toHaveText('Pan: 0,0');
  });

  test('portals modals', async ({ page }) => {
    await page.getByRole('button', { name: 'Open modal' }).click();
    await expect(page.getByRole('heading', { name: 'RNW modal' })).toBeVisible();
    await page.getByRole('button', { name: 'Close modal' }).click();
    await expect(page.getByRole('heading', { name: 'RNW modal' })).toBeHidden();
  });

  test('virtualizes a scrolled list', async ({ page }) => {
    const pageErrors = pageCollectErrors(page);
    await page.getByRole('button', { name: 'Mount list' }).click();
    expect(pageErrors.errors.map((error) => error.message)).toEqual([]);
    await expect(page.getByTestId('row-0')).toBeVisible();
    await page.getByRole('button', { name: 'Scroll list to end' }).click();
    await expect(page.getByTestId('row-29')).toBeVisible();
  });
});
