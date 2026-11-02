import { test, expect } from '@playwright/test';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getRouterE2ERoot } from '../../__tests__/utils';
import { createExpoServe, executeExpoAsync } from '../../utils/expo';
import { pageCollectErrors } from '../page';

declare global {
  interface Window {
    safeAreaServerNodes: Map<string, Element>;
  }
}

const projectRoot = getRouterE2ERoot();
const outputDir = 'dist-safe-area-streaming';
test.describe.configure({ mode: 'serial' });
const expoServe = createExpoServe({ cwd: projectRoot, env: { NODE_ENV: 'production' } });

test.beforeAll(async () => {
  clearEnv();
  await executeExpoAsync(projectRoot, ['export', '-p', 'web', '--output-dir', outputDir], {
    env: {
      NODE_ENV: 'production',
      EXPO_USE_STATIC: 'server',
      E2E_ROUTER_SRC: 'static-rendering',
      E2E_ROUTER_ASYNC: 'false',
    },
  });
  await expoServe.startAsync([outputDir]);
});

test.afterAll(async () => {
  await expoServe.stopAsync();
  restoreEnv();
});

for (const path of ['/safe-area', '/safe-area-stack']) {
  test(`retains streamed nodes through hydration and resize: ${path}`, async ({ page }) => {
    const errors = pageCollectErrors(page);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setSafeAreaInsetsOverride', {
      insets: { top: 24, right: 12, bottom: 16, left: 8 },
    });
    await page.addInitScript(() => {
      window.safeAreaServerNodes = new Map();
      new MutationObserver((records) => {
        for (const record of records) {
          for (const node of record.addedNodes) {
            if (!(node instanceof Element)) continue;
            const elements = [node, ...node.querySelectorAll('#shell, #first, #second')];
            for (const element of elements) {
              if (['shell', 'first', 'second'].includes(element.id)) {
                if (!window.safeAreaServerNodes.has(element.id)) {
                  window.safeAreaServerNodes.set(element.id, element);
                }
              }
            }
          }
        }
      }).observe(document, { childList: true, subtree: true });
    });

    await page.goto(new URL(path, expoServe.url).href, { waitUntil: 'commit' });
    await expect(page.locator('#first-fallback')).toBeVisible();
    await expect(page.locator('#second-fallback')).toBeVisible();
    await expect(page.locator('script[src]')).toHaveAttribute('defer', '');
    await expect(page.getByTestId('hydration-status')).toHaveText('unmounted');
    const content = page.locator('.safe-area-content');
    await expect(content).toHaveCSS('padding', '24px 12px 16px 8px');
    await expect(page.getByTestId('hydration-status')).toHaveText('mounted', { timeout: 15000 });
    await expect(content).toHaveCSS('padding', '24px 12px 16px 8px');
    await expect(page.getByTestId('click-status')).toHaveText('unclicked');
    await page.locator('#shell').click();
    await expect(page.getByTestId('click-status')).toHaveText('clicked');
    await page.setViewportSize({ width: 900, height: 700 });
    await cdp.send('Emulation.setSafeAreaInsetsOverride', {
      insets: { top: 40, right: 18, bottom: 20, left: 10 },
    });
    await expect(content).toHaveCSS('padding', '40px 18px 20px 10px');

    await expect(page.locator('#root #first')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#root #second')).toBeVisible({ timeout: 15000 });
    await page.waitForLoadState('load');
    for (const id of ['shell', 'first', 'second']) {
      expect(
        await page.evaluate((id) => {
          const node = window.safeAreaServerNodes.get(id);
          return node?.isConnected && node === document.querySelector(`#root #${id}`);
        }, id)
      ).toBe(true);
    }
    expect(errors.all).toEqual([]);
  });
}
