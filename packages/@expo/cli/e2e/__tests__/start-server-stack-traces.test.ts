/* eslint-env jest */
import { stripVTControlCharacters } from 'node:util';

import { createExpoStart } from '../utils/expo';
import { getServerTesterRoot } from './utils';

describe('server stack traces in development', () => {
  const output: string[] = [];
  const expo = createExpoStart({
    cwd: getServerTesterRoot(),
    env: {
      NODE_ENV: 'development',
      E2E_ROUTER_WEB_OUTPUT: 'server',
      TEST_THROW_ERROR: 'true',
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
    const response = await expo.fetchAsync('/errors/throw');
    expect(response.status).toBe(500);

    const logs = await waitForOutputAsync(/Thrown from an API route[\s\S]*Call Stack/);
    expect(logs).toMatch(/fail \(.*app[\\/]errors[\\/]throw\+api\.ts:2:9\)/);
    expect(logs).toMatch(/GET \(.*app[\\/]errors[\\/]throw\+api\.ts:6:3\)/);
    expect(logs).not.toMatch(/throw\+api\.ts\.bundle/);
  });

  test('maps server data loader errors to the original source', async () => {
    const response = await expo.fetchAsync('/errors/loader');
    expect(response.status).toBe(500);

    const logs = await waitForOutputAsync(/Thrown from a loader[\s\S]*Call Stack/);
    expect(logs).toMatch(/fail \(.*app[\\/]errors[\\/]loader\.tsx:5:9\)/);
    expect(logs).toMatch(/loader \(.*app[\\/]errors[\\/]loader\.tsx:10:5\)/);
  });
});
