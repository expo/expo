/* This tests rendering an app with URI-unsafe characters in the project path.
 * We have a project inside a "with spaces" folder and expect it to render as
 * expected in development.
 * See:
 * - https://github.com/expo/expo/pull/34289
 * - https://github.com/expo/expo/issues/32843
 */

import path from 'path';
import fs from 'fs';
import { test, expect } from '@playwright/test';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { createExpoStart } from '../../utils/expo';
import { pageCollectErrors } from '../page';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

const expoRouterSrc = path.resolve(__dirname, '../../../../../../packages/expo-router');
const projectRoot = path.resolve(__dirname, '../../../../../../apps/router-e2e with spaces');

test.describe('router-e2e with spaces', () => {
  const expoStart = createExpoStart({
    cwd: projectRoot,
    env: {
      NODE_ENV: 'development',
    },
  });

  test.beforeEach(async () => {
    console.time('expo start');
    await expoStart.startAsync();
    console.timeEnd('expo start');

    console.time('Eagerly bundled JS');
    await expoStart.fetchBundleAsync('/');
    console.timeEnd('Eagerly bundled JS');
  });

  test.afterEach(async () => {
    await expoStart.stopAsync();
  });

  test('renders without errors', async ({ page }) => {
    // Listen for console logs and errors
    const pageErrors = pageCollectErrors(page);

    await page.goto(new URL('/', expoStart.url).href);

    // Ensure the initial hash is correct
    await expect(page.locator('[data-testid="content"]')).toHaveText('Test');

    expect(pageErrors.all).toEqual([]);
  });
});
