import { vol } from 'memfs';

import { copyTemplateMetroConfig } from '../writeMetroConfig';

jest.mock('fs');
jest.mock('resolve-from');

describe(copyTemplateMetroConfig, () => {
  afterEach(() => {
    vol.reset();
  });

  it(`copies template Metro config into project without a metro.config.js`, async () => {
    const projectRoot = '/app';
    vol.fromJSON({ 'package.json': '' }, projectRoot);

    const tempDir = '/tmp';
    vol.fromJSON({ 'metro.config.js': 'foobar' }, tempDir);
    const didCopy = copyTemplateMetroConfig(projectRoot, {
      pkg: {},
      tempDir,
    });
    expect(didCopy).toBe(true);
    expect(vol.toJSON()['/app/metro.config.js']).toBe(vol.toJSON()['/tmp/metro.config.js']);
  });

  it(`returns false if the project has an existing Metro config that matches the current template`, async () => {
    const projectRoot = '/app';
    vol.fromJSON({ 'metro.config.js': 'foobar' }, projectRoot);

    const tempDir = '/tmp';
    vol.fromJSON({ 'metro.config.js': 'foobar' }, tempDir);

    expect(
      copyTemplateMetroConfig(projectRoot, {
        pkg: { metro: {} },
        tempDir,
      })
    ).toBe(false);
  });

  it(`throws an error if an existing Metro config is in use and doesn't match the template`, async () => {
    const projectRoot = '/app';
    vol.fromJSON({ 'metro.config.js': 'foobar2' }, projectRoot);

    const tempDir = '/tmp';
    vol.fromJSON({ 'metro.config.js': 'foobar' }, tempDir);

    expect(() =>
      copyTemplateMetroConfig(projectRoot, {
        pkg: { metro: {} },
        tempDir,
      })
    ).toThrow(/Project metro\.config\.js does not match prebuild template/);
  });

  it(`throws an error if a legacy Metro config format is used (pkg metro)`, async () => {
    const projectRoot = '/app';
    const tempDir = '/tmp';

    expect(() =>
      copyTemplateMetroConfig(projectRoot, {
        pkg: { metro: {} },
        tempDir,
      })
    ).toThrow(/Project is using a legacy config system that cannot be extend automatically/);
  });

  it(`throws an error if a legacy Metro config format is used (rn-cli.config.js)`, async () => {
    const projectRoot = '/app';
    vol.fromJSON({ 'rn-cli.config.js': '' }, projectRoot);

    const tempDir = '/tmp';
    vol.fromJSON({ 'metro.config.js': 'foobar' }, tempDir);
    expect(() =>
      copyTemplateMetroConfig(projectRoot, {
        pkg: {},
        tempDir,
      })
    ).toThrow(/Project is using a legacy config system that cannot be extend automatically/);
  });
});
