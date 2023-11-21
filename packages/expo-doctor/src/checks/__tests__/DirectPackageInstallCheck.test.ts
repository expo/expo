import { vol } from 'memfs';

import {
  DirectPackageInstallCheck,
  directPackageInstallCheckItems,
} from '../DirectPackageInstallCheck';

jest.mock('fs');

const projectRoot = '/tmp/project';

// required by runAsync
const additionalProjectProps = {
  exp: {
    name: 'name',
    slug: 'slug',
    sdkVersion: '48.0.0',
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
    const check = new DirectPackageInstallCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
  });

  it(`returns result with isSuccessful = true if package.json contains a dependency that is on list, but SDK requirement is not met`, async () => {
    const check = new DirectPackageInstallCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0', dependencies: { '@types/react-native': '17.0.1' } },
      ...additionalProjectProps,
      exp: {
        name: 'name',
        slug: 'slug',
        sdkVersion: '47.0.0',
      },
    });
    expect(result.isSuccessful).toBeTruthy();
  });

  const dependencyLocations = ['dependencies', 'devDependencies'];

  dependencyLocations.forEach(dependencyLocation => {
    it(`returns result with isSuccessful = true if ${dependencyLocation} does not contain a dependency that should only be installed by another Expo package`, async () => {
      const check = new DirectPackageInstallCheck();
      const result = await check.runAsync({
        pkg: { name: 'name', version: '1.0.0', [dependencyLocation]: { somethingjs: '17.0.1' } },
        ...additionalProjectProps,
      });
      expect(result.isSuccessful).toBeTruthy();
    });

    directPackageInstallCheckItems.forEach(transitiveOnlyDependency => {
      it(`returns result with isSuccessful = false if ${dependencyLocation} contains ${transitiveOnlyDependency.packageName}`, async () => {
        const check = new DirectPackageInstallCheck();
        const result = await check.runAsync({
          pkg: {
            name: 'name',
            version: '1.0.0',
            [dependencyLocation]: { [transitiveOnlyDependency.packageName]: '1.0.0' },
          },
          ...additionalProjectProps,
        });
        expect(result.isSuccessful).toBeFalsy();
      });
    });
  });
});
