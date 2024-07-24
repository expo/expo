import { vol } from 'memfs';
import nock from 'nock';
import prompts from 'prompts';

import {
  ensureExampleExists,
  GithubContent,
  promptExamplesAsync,
  sanitizeScriptsAsync,
} from '../Examples';
import { env } from '../utils/env';

jest.mock('fs');
jest.mock('prompts');

describe(ensureExampleExists, () => {
  it('resolves when example exists', async () => {
    const scope = nock('https://api.github.com')
      .get('/repos/expo/examples/contents/test/package.json')
      .reply(200);

    await expect(ensureExampleExists('test')).resolves.not.toThrow();

    scope.done();
  });

  it('rejects when example does note exists', async () => {
    const scope = nock('https://api.github.com')
      .get('/repos/expo/examples/contents/test/package.json')
      .reply(404);

    await expect(() => ensureExampleExists('test')).rejects.toThrow(/example.*does not exist/i);

    scope.done();
  });

  it('throws when running into rate limits', async () => {
    const scope = nock('https://api.github.com')
      .get('/repos/expo/examples/contents/test/package.json')
      .reply(403);

    await expect(() => ensureExampleExists('test')).rejects.toThrow(
      /unexpected GitHub API response/i
    );

    scope.done();
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

    const scope = nock('https://api.github.com')
      .get('/repos/expo/examples/contents')
      .reply(200, examples);

    jest.mocked(prompts).mockResolvedValue({ answer: 'test-1' });

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
    scope.done();
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
