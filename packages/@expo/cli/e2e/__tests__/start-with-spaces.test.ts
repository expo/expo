/* eslint-env jest */
/**
 * This tests rendering an app with URI-unsafe characters in the project path.
 * We have a project inside a "with spaces" folder and expect it to render as
 * expected in development.
 * See:
 * - https://github.com/expo/expo/pull/34289
 * - https://github.com/expo/expo/issues/32843
 */
import { clearEnv, restoreEnv } from './export/export-side-effects';
import { setupTestProjectWithOptionsAsync, getHtml } from './utils';
import { createExpoStart } from '../utils/expo';

beforeAll(() => clearEnv());
afterAll(() => restoreEnv());

describe('router-e2e with spaces', () => {
  let expoStart: ReturnType<typeof createExpoStart>;

  beforeAll(async () => {
    const projectRoot = await setupTestProjectWithOptionsAsync(
      // NOTE(@kitten): This space is reflected in the project root:
      'with spaces',
      'with-router',
      // We're installing the @expo/cli from our workspace source into the newly
      // created project. This is required to be able to execute the SSR bundle
      // outside the Expo monorepo module
      {
        // TODO(@hassankhan, @krystofwoldrich): remove linked packages after publishing
        linkExpoPackages: ['@expo/router-server', 'expo-router', '@expo/log-box'],
        linkExpoPackagesDev: ['@expo/cli', 'expo-server'],
      }
    );

    expoStart = createExpoStart({
      // Use linked version of @expo/cli via `bun expo-internal`:
      command: (port) => ['bun', 'expo-internal', 'start', `--port=${port}`],
      cwd: projectRoot,
      env: {
        NODE_ENV: 'development',
        E2E_USE_STATIC: 'static',
      },
    });

    console.time('expo start');
    await expoStart.startAsync();
    console.timeEnd('expo start');
  });

  afterAll(async () => {
    await expoStart.stopAsync();
  });

  it('renders without errors', async () => {
    const response = await expoStart.fetchAsync('/');

    expect(response.status).toBe(200);

    const html = getHtml(await response.text());
    const content = html.querySelector('[data-testid="content"]');

    expect(content?.textContent).toBe('Index');
  });
});
