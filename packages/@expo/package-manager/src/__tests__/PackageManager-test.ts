import spawnAsync from '@expo/spawn-async';
import { vol } from 'memfs';

import { createForProject, getModulesPath, getPossibleProjectRoot, isUsingYarn } from '../index';

jest.mock('fs');

jest.mock(`@expo/spawn-async`, () => {
  const actualModule = jest.requireActual('@expo/spawn-async');

  return {
    __esModule: true,
    ...actualModule,
    // minimal implementation is needed here because the packager manager depends on the child property to exist.
    default: jest.fn((_command, _args, _options) => {
      const promise = new Promise((resolve, _reject) => resolve({}));
      // @ts-ignore: TypeScript isn't aware the Promise constructor argument runs synchronously
      promise.child = {};
      return promise;
    }),
  };
});

describe('createForProject', () => {
  const projectRoot = '/foo/';
  it(`creates npm package manager from options`, () => {
    const manager = createForProject(projectRoot, { npm: true });
    expect(manager.name).toBe('npm');
  });
  it(`creates yarn package manager from options`, () => {
    const manager = createForProject(projectRoot, { yarn: true });
    expect(manager.name).toBe('Yarn');
  });
  it(`creates pnpm package manager from options`, () => {
    const manager = createForProject(projectRoot, { pnpm: true });
    expect(manager.name).toBe('pnpm');
  });
  it(`defaults to npm package manager`, () => {
    const manager = createForProject(projectRoot);
    expect(manager.name).toBe('npm');
  });
});

describe('getPossibleProjectRoot', () => {
  const projectRoot = '/foo/';
  it(`returns a string`, () => {
    vol.fromJSON({ [process.cwd()]: null }, projectRoot);
    expect(typeof getPossibleProjectRoot()).toBe('string');
  });
});

describe('getModulesPath', () => {
  it(`returns a string ending in node_modules`, () => {
    expect(getModulesPath(__dirname).endsWith('node_modules')).toBe(true);
  });
});

describe('isUsingYarn', () => {
  it(`returns a boolean`, () => {
    expect(typeof isUsingYarn(__dirname)).toBe('boolean');
  });
});

describe('addWithParameters', () => {
  it(`passes parameters to the package manager when called without packages`, async () => {
    const projectRoot = '/foo/';
    const manager = createForProject(projectRoot, { npm: true });
    await manager.addWithParametersAsync([], ['--loglevel', 'verbose']);

    expect(spawnAsync).toBeCalledWith(
      'npm',
      ['install', '--loglevel', 'verbose'],
      expect.anything()
    );
  });

  it(`passes parameters to the package manager when called with versioned packages`, async () => {
    const projectRoot = '/foo/';
    vol.fromJSON({ 'package.json': '{}' }, projectRoot);
    const manager = createForProject(projectRoot, { npm: true });
    await manager.addWithParametersAsync(['my-package@1.2.3'], ['--loglevel', 'verbose']);

    expect(spawnAsync).toBeCalledWith(
      'npm',
      ['install', '--loglevel', 'verbose'],
      expect.anything()
    );
  });

  it(`passes parameters to the package manager when called with unversioned packages`, async () => {
    const projectRoot = '/foo/';
    vol.fromJSON({ 'package.json': '{}' }, projectRoot);
    const manager = createForProject(projectRoot, { npm: true });
    await manager.addWithParametersAsync(['my-package'], ['--loglevel', 'verbose']);

    expect(spawnAsync).toBeCalledWith(
      'npm',
      ['install', '--save', 'my-package', '--loglevel', 'verbose'],
      expect.anything()
    );
  });

  it(`gets called by the existing addAsync method`, async () => {
    const projectRoot = '/foo/';
    vol.fromJSON({ 'package.json': '{}' }, projectRoot);
    const manager = createForProject(projectRoot, { npm: true });
    const spy = jest.spyOn(manager, 'addWithParametersAsync');

    await manager.addAsync('my-package');

    expect(spy).toBeCalled();
  });
});
