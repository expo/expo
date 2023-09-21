import { vol, fs } from 'memfs';

import { setupTypedRoutes } from '../routes';
import { startTypescriptTypeGenerationAsync } from '../startTypescriptTypeGeneration';

jest.mock('../routes', () => ({ setupTypedRoutes: jest.fn() }));
jest.mock('../../../../log');

afterEach(() => {
  vol.reset();
});

it(`sets up typed routes`, async () => {
  vol.fromJSON(
    {
      'tsconfig.json': JSON.stringify({}),
      'package.json': JSON.stringify({ name: 'test-project' }),
      'app.json': JSON.stringify({
        expo: { sdkVersion: '49.0.0', experiments: { typedRoutes: true } },
      }),
    },
    '/'
  );

  // This function is mocked so the metro instance doesn't need to be qualified.
  const metro: any = {};
  const server = { close: jest.fn(), addEventListener: jest.fn() };

  await startTypescriptTypeGenerationAsync({ projectRoot: '/', server, metro });

  expect(setupTypedRoutes).toBeCalledWith({
    metro,
    projectRoot: '/',
    routerDirectory: '/app',
    server,
    typesDirectory: '/.expo/types',
  });

  expect(Object.keys(vol.toJSON())).toEqual([
    '/tsconfig.json',
    '/package.json',
    '/app.json',
    '/.expo/README.md',
    '/.expo/types',
    '/.gitignore',
    '/expo-env.d.ts',
  ]);

  expect(fs.readFileSync('/expo-env.d.ts', 'utf8')).toMatch(`/// <reference types="expo/types" />

// NOTE: This file should not be edited and should be in your git ignore`);
  expect(fs.readFileSync('/.gitignore', 'utf8')).toMatch('expo-env.d.ts');
});

it(`sets up typed routes and removes`, async () => {
  vol.fromJSON(
    {
      'tsconfig.json': JSON.stringify({}),
      'package.json': JSON.stringify({ name: 'test-project' }),
      'app.json': JSON.stringify({
        expo: { sdkVersion: '49.0.0', experiments: { typedRoutes: true } },
      }),
    },
    '/'
  );

  // This function is mocked so the metro instance doesn't need to be qualified.
  const metro: any = {};
  const server = { close: jest.fn(), addEventListener: jest.fn() };

  await startTypescriptTypeGenerationAsync({ projectRoot: '/', server, metro });

  expect(setupTypedRoutes).toBeCalledWith({
    metro,
    projectRoot: '/',
    routerDirectory: '/app',
    server,
    typesDirectory: '/.expo/types',
  });

  // Disable the feature
  fs.writeFileSync('/app.json', JSON.stringify({ expo: { sdkVersion: '49.0.0' } }));

  // Remove the side-effects
  await startTypescriptTypeGenerationAsync({ projectRoot: '/', server, metro });

  expect(Object.keys(vol.toJSON())).toEqual([
    '/tsconfig.json',
    '/package.json',
    '/app.json',
    '/.expo/README.md',
    '/.expo/types',
    '/.gitignore',
  ]);
  expect(fs.readFileSync('/.gitignore', 'utf8')).not.toMatch('expo-env.d.ts');
});

it(`removes typed routes from malformed project`, async () => {
  vol.fromJSON(
    {
      'tsconfig.json': JSON.stringify({
        compilerOptions: {
          baseUrl: '.',
          paths: {
            '@/*': ['./*'],
          },
        },
        extends: 'expo/tsconfig.base',
        include: ['**/*.ts', '**/*.tsx', '.expo/types/**/*.ts', 'expo-env.d.ts'],
      }),
      '.expo/types/router.d.ts': 'declare module "expo-router" {}',
      'expo-env.d.ts': 'foobar',
      '.gitignore': `expo-env.d.ts\n/ios\n.DS_Store\n`,
      'package.json': JSON.stringify({ name: 'test-project' }),
      'app.json': JSON.stringify({
        expo: { sdkVersion: '49.0.0' },
      }),
    },
    '/'
  );

  // This function is mocked so the metro instance doesn't need to be qualified.
  const metro: any = {};
  const server = { close: jest.fn(), addEventListener: jest.fn() };

  await startTypescriptTypeGenerationAsync({ projectRoot: '/', server, metro });

  expect(setupTypedRoutes).not.toBeCalled();

  expect(Object.keys(vol.toJSON())).toEqual([
    '/tsconfig.json',
    // This is left intact because it's no longer linked and a bit faster to leave it as-is.
    // This may change in the future if needed.
    '/.expo/types/router.d.ts',
    '/.gitignore',
    '/package.json',
    '/app.json',
  ]);

  expect(fs.readFileSync('/.gitignore', 'utf8')).not.toMatch('expo-env.d.ts');
});
