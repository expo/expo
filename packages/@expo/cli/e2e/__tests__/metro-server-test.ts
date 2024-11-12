import execa from 'execa';
import fs from 'fs-extra';
import assert from 'node:assert';
import path from 'node:path';

import { bin, ensurePortFreeAsync, setupTestProjectWithOptionsAsync } from './utils';

describe('bundling code', () => {
  const metro = withMetroServer('metro-server-bundle-code', 'with-blank');

  it('bundles the app entry point', async () => {
    const response = await metro.fetch('/App.bundle?platform=ios');
    expect(response).toMatchObject({ status: 200 });
    expect(response.headers.get('Content-Type')).toContain('application/javascript');
  });
});

describe('serving assets', () => {
  const metro = withMetroServer('metro-server-bundle-asset', 'with-assets');

  it('serves assets using url pathname references', async () => {
    const response = await metro.fetch('/assets/assets/icon.png');
    expect(response).toMatchObject({ status: 200 });
    expect(response.headers.get('Content-Type')).toContain('image/png');
  });

  it('serves assets using unstable_path references', async () => {
    const response = await metro.fetch(
      `/assets?unstable_path=${encodeURIComponent('./assets/icon.png')}`
    );
    expect(response).toMatchObject({ status: 200 });
    expect(response.headers.get('Content-Type')).toContain('image/png');
  });

  it('serves assets from public folder', async () => {
    const response = await metro.fetch('/favicon.ico');
    expect(response).toMatchObject({ status: 200 });
    expect(response.headers.get('Content-Type')).toContain('image/x-icon');
  });
});

function withMetroServer(testName: string, fixtureName = 'with-blank') {
  // Could take 45s depending on how fast npm installs
  jest.setTimeout(120 * 1000);

  const port = 8089;

  let projectRoot: string | null = null;
  // Keep track of the Metro server process
  let metroProcess: execa.ExecaChildProcess<string> | null = null;

  // Ensure the test project is set up before the tests start
  beforeAll(() => setupServer());
  // Ensure the Metro server is active before each test, even when closed manually
  beforeEach(() => startServer());
  // Ensure the Metro server is killed after all tests
  afterAll(() => killServer());

  async function setupServer() {
    // Prepare the test project
    projectRoot = await setupTestProjectWithOptionsAsync(testName, fixtureName);
    // Ensure no .expo directory / previous state is present
    await fs.remove(path.join(projectRoot, '.expo'));
  }

  async function killServer() {
    metroProcess?.kill('SIGINT');
    await metroProcess;
    metroProcess = null;
  }

  async function stopServer() {
    metroProcess?.kill('SIGTERM');
    await metroProcess;
    metroProcess = null;
  }

  async function startServer() {
    assert(projectRoot !== null, 'Metro server project is not set up yet');
    if (metroProcess) return;

    console.log('Starting server');

    metroProcess = execa('node', [bin, 'start', '--port=' + port], {
      cwd: projectRoot!,
      env: {
        ...process.env,
        EXPO_USE_FAST_RESOLVER: 'true',
        TEST_BABEL_PRESET_EXPO_MODULE_ID: require.resolve('babel-preset-expo'),
      },
    });

    // Wait until the server crashed or is up and running
    await new Promise<void>((resolve, reject) => {
      assert(metroProcess, 'Metro server is not started yet');

      metroProcess.on('close', (code: number) => {
        reject(
          code === 0
            ? `Server closed too early. Run \`kill -9 $(lsof -ti:${port})\` to kill the orphaned process.`
            : code
        );
      });

      metroProcess.stdout?.on('data', (data) => {
        const stdout = data.toString();
        console.log('output:', stdout);
        if (stdout.includes('Logs for your project')) {
          resolve();
        }
      });
    });
  }

  return {
    startServer,
    stopServer,
    killServer,
    fetch: (path: string, init?: RequestInit) => fetch(`http://localhost:${port}${path}`, init),
  };
}
