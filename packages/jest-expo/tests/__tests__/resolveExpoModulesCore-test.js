import fs from 'fs';
import os from 'os';
import path from 'path';

import { resolveExpoModulesCoreModuleId } from '../../src/preset/resolveExpoModulesCore';

function createResolver(resolutions) {
  return (moduleId, options) => {
    const lookupKey = options?.paths?.length
      ? `${moduleId}\0${options.paths.join('\0')}`
      : moduleId;
    const resolution = resolutions[lookupKey];

    if (resolution) {
      return resolution;
    }

    throw Object.assign(new Error(`Cannot find module '${moduleId}'`), {
      code: 'MODULE_NOT_FOUND',
    });
  };
}

it('resolves expo-modules-core directly when it is available at the project root', () => {
  expect(
    resolveExpoModulesCoreModuleId(
      'expo-modules-core',
      createResolver({
        'expo-modules-core': '/app/node_modules/expo-modules-core/index.js',
      })
    )
  ).toBe('/app/node_modules/expo-modules-core/index.js');
});

it('resolves expo-modules-core through expo when npm nests the dependency', () => {
  expect(
    resolveExpoModulesCoreModuleId(
      'expo-modules-core',
      createResolver({
        'expo/package.json': '/app/node_modules/expo/package.json',
        'expo-modules-core\0/app/node_modules/expo':
          '/app/node_modules/expo/node_modules/expo-modules-core/index.js',
      })
    )
  ).toBe('/app/node_modules/expo/node_modules/expo-modules-core/index.js');
});

it('resolves expo-modules-core subpaths through expo when npm nests the dependency', () => {
  expect(
    resolveExpoModulesCoreModuleId(
      'expo-modules-core/src/polyfill/dangerous-internal',
      createResolver({
        'expo/package.json': '/app/node_modules/expo/package.json',
        'expo-modules-core/src/polyfill/dangerous-internal\0/app/node_modules/expo':
          '/app/node_modules/expo/node_modules/expo-modules-core/src/polyfill/dangerous-internal.js',
      })
    )
  ).toBe(
    '/app/node_modules/expo/node_modules/expo-modules-core/src/polyfill/dangerous-internal.js'
  );
});

it('uses Node resolution paths for expo nested dependencies', () => {
  const fixtureRoot = fs.mkdtempSync(
    path.join(fs.realpathSync(os.tmpdir()), 'jest-expo-modules-core-')
  );
  const expoDir = path.join(fixtureRoot, 'node_modules', 'expo');
  const expoModulesCoreDir = path.join(expoDir, 'node_modules', 'expo-modules-core');

  try {
    fs.mkdirSync(path.join(expoModulesCoreDir, 'src', 'polyfill'), { recursive: true });
    fs.writeFileSync(path.join(expoDir, 'package.json'), '{}');
    fs.writeFileSync(path.join(expoModulesCoreDir, 'package.json'), '{"main":"index.js"}');
    fs.writeFileSync(path.join(expoModulesCoreDir, 'index.js'), '');
    fs.writeFileSync(path.join(expoModulesCoreDir, 'src', 'polyfill', 'dangerous-internal.js'), '');

    const resolver = (moduleId, options) => {
      if (moduleId === 'expo/package.json') {
        return path.join(expoDir, 'package.json');
      }
      if (!options) {
        throw new Error(`Cannot find module '${moduleId}'`);
      }
      return require.resolve(moduleId, options);
    };

    expect(resolveExpoModulesCoreModuleId('expo-modules-core', resolver)).toBe(
      path.join(expoModulesCoreDir, 'index.js')
    );
    expect(
      resolveExpoModulesCoreModuleId('expo-modules-core/src/polyfill/dangerous-internal', resolver)
    ).toBe(path.join(expoModulesCoreDir, 'src', 'polyfill', 'dangerous-internal.js'));
  } finally {
    fs.rmSync(fixtureRoot, { force: true, recursive: true });
  }
});

it('falls back to the original module id so Jest reports the normal resolver error', () => {
  expect(resolveExpoModulesCoreModuleId('expo-modules-core', createResolver({}))).toBe(
    'expo-modules-core'
  );
});
