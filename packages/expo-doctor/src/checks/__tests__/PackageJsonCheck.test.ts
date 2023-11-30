import { vol } from 'memfs';

import { PackageJsonCheck } from '../PackageJsonCheck';

jest.mock('fs');

const projectRoot = '/tmp/project';

// required by runAsync
const additionalProjectProps = {
  exp: {
    name: 'name',
    slug: 'slug',
  },
  projectRoot,
};

describe('runAsync', () => {
  beforeEach(() => {
    vol.fromJSON({
      [projectRoot + '/node_modules/.bin/expo']: 'test',
    });
  });

  it('returns result with isSuccessful = true if empty dependencies, devDependencies, scripts', async () => {
    const check = new PackageJsonCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
  });

  // bin/ expo script conflict sub-check

  it('returns result with isSuccessful = true if scripts does not contain expo', async () => {
    const check = new PackageJsonCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0', scripts: { start: 'start' } },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
  });

  it('returns result with isSuccessful = false if scripts contain expo', async () => {
    const check = new PackageJsonCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0', scripts: { expo: 'start' } },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeFalsy();
  });

  it('returns result with isSuccessful = false if scripts contain another bin', async () => {
    vol.fromJSON({
      [projectRoot + '/node_modules/.bin/otherbin']: 'test',
    });
    const check = new PackageJsonCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0', scripts: { otherbin: 'start' } },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeFalsy();
  });

  it('returns result with isSuccessful = false if no node_modules/.bin present, but expo script is', async () => {
    vol.fromJSON({});
    const check = new PackageJsonCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0', scripts: { expo: 'start' } },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeFalsy();
  });

  // package name conflicts with installed packages sub-check
  it('returns result with isSuccessful = true if package name does not match dependency', async () => {
    const check = new PackageJsonCheck();
    const result = await check.runAsync({
      pkg: {
        name: 'package-name',
        version: '1.0.0',
        dependencies: { 'something-js': '17.0.1' },
        devDependencies: { 'something-else-js': '17.0.1' },
      },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
  });

  it('returns result with isSuccessful = false if package name matches dependency', async () => {
    const check = new PackageJsonCheck();
    const result = await check.runAsync({
      pkg: {
        name: 'something-js',
        version: '1.0.0',
        dependencies: { 'something-js': '17.0.1' },
        devDependencies: { 'something-else-js': '17.0.1' },
      },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeFalsy();
  });

  it('returns result with isSuccessful = false if package name matches dev dependency', async () => {
    const check = new PackageJsonCheck();
    const result = await check.runAsync({
      pkg: {
        name: 'something-else-js',
        version: '1.0.0',
        dependencies: { 'something-js': '17.0.1' },
        devDependencies: { 'something-else-js': '17.0.1' },
      },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeFalsy();
  });
});
