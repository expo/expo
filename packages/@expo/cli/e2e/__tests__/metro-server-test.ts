import execa from 'execa';
import fs from 'fs-extra';
import path from 'node:path';

import { bin, ensurePortFreeAsync, installAsync, setupTestProjectWithOptionsAsync } from './utils';

const kill = () => ensurePortFreeAsync(8081);

beforeEach(() => kill());
afterAll(() => kill());

it(
  'runs Metro server with built-in middleware stack',
  async () => {
    // Prepare the test project
    const projectRoot = await setupTestProjectWithOptionsAsync('metro-with-builtin', 'with-blank');
    await fs.remove(path.join(projectRoot, '.expo'));

    const startPromise = execa('node', [bin, 'start'], {
      cwd: projectRoot,
      env: {
        ...process.env,
        EXPO_USE_FAST_RESOLVER: 'true',
      },
    });

    // Start the dev server
    console.log('Starting server');
    await new Promise<void>((resolve, reject) => {
      startPromise.on('close', (code: number) => {
        reject(
          code === 0
            ? 'Server closed too early. Run `kill -9 $(lsof -ti:8081)` to kill the orphaned process.'
            : code
        );
      });

      startPromise.stdout?.on('data', (data) => {
        const stdout = data.toString();
        console.log('output:', stdout);
        if (stdout.includes('Logs for your project')) {
          resolve();
        }
      });
    });

    // Test if `/debugger-ui` now returns the app manifest instead
    const response = await fetch('http://localhost:8081/debugger-ui');
    expect(response).toMatchObject({ status: 200 });
    const text = await response.text();
    expect(() => JSON.parse(text)).not.toThrow();

    // Clean up server
    startPromise.kill('SIGTERM');
    await startPromise;
  },
  // Could take 45s depending on how fast npm installs
  120 * 1000
);

it(
  'runs Metro server with `@react-native-community/cli-server-api` when installed',
  async () => {
    // Prepare the test project
    const projectRoot = await setupTestProjectWithOptionsAsync('metro-with-rnccli', 'with-blank');
    await fs.remove(path.join(projectRoot, '.expo'));

    // Install `@react-native-community/cli-server-api`
    await installAsync(projectRoot, ['@react-native-community/cli-server-api']);
    // Reinstall all modules, Bun has issues with similar but older dependencies not being installed
    await fs.remove(path.join(projectRoot, 'node_modules'));
    await installAsync(projectRoot);

    const startPromise = execa('node', [bin, 'start'], {
      cwd: projectRoot,
      env: {
        ...process.env,
        EXPO_USE_FAST_RESOLVER: 'true',
      },
    });

    // Start the dev server
    console.log('Starting server');
    await new Promise<void>((resolve, reject) => {
      startPromise.on('close', (code: number) => {
        reject(
          code === 0
            ? 'Server closed too early. Run `kill -9 $(lsof -ti:8081)` to kill the orphaned process.'
            : code
        );
      });

      startPromise.stdout?.on('data', (data) => {
        const stdout = data.toString();
        console.log('output:', stdout);
        if (stdout.includes('Logs for your project')) {
          resolve();
        }
      });
    });

    // Test if `/debugger-ui` returns the remote debugging workflow
    const response = await fetch('http://localhost:8081/debugger-ui');
    expect(response).toMatchObject({ status: 200 });
    await expect(response.text()).resolves.toContain('Remote JavaScript debugging');

    // Clean up server
    startPromise.kill('SIGTERM');
    await startPromise;
  },
  // Could take 45s depending on how fast npm installs
  120 * 1000
);
