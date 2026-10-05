/* eslint-env jest */
import { stripVTControlCharacters } from 'node:util';

import { createExpoStart } from '../utils/expo';
import { getRouterE2ERoot } from './utils';

describe('server stack traces in development', () => {
  const output: string[] = [];
  const expo = createExpoStart({
    cwd: getRouterE2ERoot(),
    env: {
      NODE_ENV: 'development',
      EXPO_USE_STATIC: 'server',
      E2E_ROUTER_SRC: 'server-stack-traces',
      CI: '0',
    },
    onOutput(chunk) {
      output.push(stripVTControlCharacters(chunk));
    },
  });

  async function waitForOutputAsync(pattern: RegExp): Promise<string> {
    const deadline = Date.now() + 30_000;
    while (Date.now() < deadline) {
      const logs = output.join('');
      if (pattern.test(logs)) {
        return logs;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error(
      `Timed out waiting for ${pattern} in the dev server output:\n${output.join('')}`
    );
  }

  beforeAll(async () => {
    await expo.startAsync();
  });

  afterAll(async () => {
    await expo.stopAsync();
  });

  test('maps API route errors to the original source', async () => {
    const response = await expo.fetchAsync('/api/throw');
    expect(response.status).toBe(500);

    const logs = await waitForOutputAsync(/Thrown from an API route/);
    expect(logs).toMatch(/at fail \(.*app[\\/]api[\\/]throw\+api\.ts:2:9\)/);
    expect(logs).toMatch(/at GET \(.*app[\\/]api[\\/]throw\+api\.ts:6:3\)/);
    expect(logs).not.toMatch(/throw\+api\.ts\.bundle/);
  });

  test('maps server data loader errors to the original source', async () => {
    const response = await expo.fetchAsync('/loader-error');
    expect(response.status).toBe(500);

    const logs = await waitForOutputAsync(/Thrown from a loader[\s\S]*Call Stack/);
    expect(logs).toMatch(/fail \(.*app[\\/]loader-error\.tsx:4:9\)/);
    expect(logs).toMatch(/loader \(.*app[\\/]loader-error\.tsx:8:3\)/);
  });
});
