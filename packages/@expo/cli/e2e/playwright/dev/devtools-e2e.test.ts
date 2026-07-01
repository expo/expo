import { expect, test } from '@playwright/test';
import { stripVTControlCharacters } from 'node:util';

import { getRouterE2ERoot } from '../../__tests__/utils';
import { createExpoStart } from '../../utils/expo';
import { processCollectOutput } from '../../utils/process';

const projectRoot = getRouterE2ERoot();
const pluginPath = '/_expo/plugins/devtools-e2e';

test.describe('devtools-e2e', () => {
  const expoStart = createExpoStart({
    cwd: projectRoot,
    env: {
      __EXPO_E2E_TEST: '1',
      EXPO_NO_QR_CODE: '1',
      CI: '0',
    },
  });
  let output: ReturnType<typeof processCollectOutput>;

  test.beforeEach(async () => {
    const startPromise = expoStart.startAsync();

    await expect
      .poll(() => {
        try {
          expoStart.process;
          return true;
        } catch {
          return false;
        }
      })
      .toBe(true);

    output = processCollectOutput(expoStart.process);
    await startPromise;
  });

  test.afterEach(async () => {
    await expoStart.stopAsync(true);
  });

  test('prints the CLI banner title and plugin URL', async () => {
    await expect
      .poll(() => stripVTControlCharacters(output.all), { timeout: 30_000 })
      .toContain('Banner E2E');

    const terminalOutput = stripVTControlCharacters(output.all);
    const pluginUrl = terminalOutput.match(
      /(http:\/\/\S+\/_expo\/plugins\/devtools-e2e)/
    )?.[1];

    expect(pluginUrl).toBeDefined();
    expect(new URL(pluginUrl!).pathname).toBe(pluginPath);
  });

  test('opens the plugin webpage', async ({ page }) => {
    await page.goto(new URL(pluginPath, expoStart.url).href);

    await expect(page.getByRole('heading', { name: 'Hello from Expo DevTools' })).toBeVisible();
    await expect(page.getByText('This static page is served from the plugin.')).toBeVisible();
  });

  test('responds from the plugin API route directly', async () => {
    const response = await expoStart.fetchAsync(`${pluginPath}/api/hello`);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    await expect(response.json()).resolves.toMatchObject({
      message: 'Hello from the plugin server! You sent a GET request.',
    });
  });

  test('connects and responds over the plugin webpage WebSocket button', async ({ page }) => {
    await page.goto(new URL(pluginPath, expoStart.url).href);

    await page.getByRole('button', { name: 'Open WebSocket' }).click();

    await expect(page.locator('#socket-log')).toContainText(
      'message: {"type":"welcome","message":"Connected to the Hello World plugin server.","pathname":"/ws","search":"?source=webpage"}'
    );
    await expect(page.locator('#socket-log')).toContainText(
      'message: {"type":"echo","message":"Hello from the webpage!"}'
    );
  });
});
