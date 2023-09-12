import { vol } from 'memfs';
import typedFetch from 'node-fetch';
import typedPrompts from 'prompts';

import {
  ensureExampleExists,
  GithubContent,
  promptExamplesAsync,
  sanitizeScriptsAsync,
} from '../Examples';
import { env } from '../utils/env';

jest.mock('fs');
jest.mock('node-fetch');
jest.mock('prompts');

const fetch = typedFetch as jest.MockedFunction<typeof typedFetch>;
const prompts = typedPrompts as jest.MockedFunction<typeof typedPrompts>;

describe(ensureExampleExists, () => {
  it('resolves when example exists', async () => {
    fetch.mockResolvedValue({ ok: true, status: 200 } as any);
    await expect(ensureExampleExists('test')).resolves.not.toThrow();
  });

  it('rejects when example does note exists', async () => {
    fetch.mockResolvedValue({ ok: false, status: 404 } as any);
    await expect(() => ensureExampleExists('test')).rejects.toThrow(/example.*does not exist/i);
  });

  it('throws when running into rate limits', async () => {
    fetch.mockResolvedValue({ ok: false, status: 403 } as any);
    await expect(() => ensureExampleExists('test')).rejects.toThrow(
      /unexpected GitHub API response/i
    );
  });
});

describe(promptExamplesAsync, () => {
  it('throws when in CI mode', async () => {
    const spy = jest.spyOn(env, 'CI', 'get').mockReturnValue(true);
    await expect(() => promptExamplesAsync()).rejects.toThrowError(/cannot prompt/i);
    spy.mockRestore();
  });

  it('prompts examples and return selected example', async () => {
    // Make this test run in CI
    const spy = jest.spyOn(env, 'CI', 'get').mockReturnValue(false);
    const examples: GithubContent[] = [
      { name: 'test-1', path: 'test-1', type: 'dir' },
      { name: 'test-2', path: 'test-2', type: 'dir' },
    ];

    fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(examples) } as any);
    prompts.mockResolvedValue({ answer: 'test-1' });

    await expect(promptExamplesAsync()).resolves.toBe('test-1');
    expect(prompts).toHaveBeenCalledWith(
      expect.objectContaining({
        choices: expect.arrayContaining([
          { title: 'test-1', value: 'test-1' },
          { title: 'test-2', value: 'test-2' },
        ]),
      })
    );

    spy.mockRestore();
  });
});

describe(sanitizeScriptsAsync, () => {
  afterEach(() => vol.reset());

  it('adds default scripts for managed apps', async () => {
    vol.fromJSON({
      '/project/package.json': JSON.stringify({
        name: 'project',
        version: '0.0.0',
      }),
    });

    await sanitizeScriptsAsync('/project');
    const packageJson = JSON.parse(String(vol.readFileSync('/project/package.json')));

    expect(packageJson.scripts).toMatchObject({
      start: 'expo start',
      android: 'expo start --android',
      ios: 'expo start --ios',
      web: 'expo start --web',
    });
  });

  it('adds default scripts for bare apps', async () => {
    vol.fromJSON({
      '/project/android/build.gradle': 'fake-gradle',
      '/project/ios/Podfile': 'fake-podfile',
      '/project/package.json': JSON.stringify({
        name: 'project',
        version: '0.0.0',
      }),
    });

    await sanitizeScriptsAsync('/project');
    const packageJson = JSON.parse(String(vol.readFileSync('/project/package.json')));

    expect(packageJson.scripts).toMatchObject({
      start: 'expo start --dev-client',
      android: 'expo run:android',
      ios: 'expo run:ios',
      web: 'expo start --web',
    });
  });

  it('does not overwrite existing scripts', async () => {
    vol.fromJSON({
      '/project/package.json': JSON.stringify({
        name: 'project',
        version: '0.0.0',
        scripts: {
          start: 'node start.js',
        },
      }),
    });

    await sanitizeScriptsAsync('/project');
    const packageJson = JSON.parse(String(vol.readFileSync('/project/package.json')));

    expect(packageJson.scripts).toMatchObject({
      start: 'node start.js',
      android: 'expo start --android',
      ios: 'expo start --ios',
      web: 'expo start --web',
    });
  });
});
