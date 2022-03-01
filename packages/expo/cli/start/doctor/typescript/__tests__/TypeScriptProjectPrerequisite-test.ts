import { vol } from 'memfs';

import { TypeScriptProjectPrerequisite } from '../TypeScriptProjectPrerequisite';

jest.mock('resolve-from');

describe('assertAsync', () => {
  beforeEach(() => {
    delete process.env.EXPO_NO_TYPESCRIPT_SETUP;
  });
  afterAll(() => {
    delete process.env.EXPO_NO_TYPESCRIPT_SETUP;
  });
  it('skips setup due to environment variable', async () => {
    process.env.EXPO_NO_TYPESCRIPT_SETUP = '1';
    const prerequisite = new TypeScriptProjectPrerequisite('/');
    await expect(prerequisite.assertAsync()).rejects.toThrowError(
      /Skipping TypeScript setup: EXPO_NO_TYPESCRIPT_SETUP is enabled\./
    );
  });
});

describe('_getSetupRequirements', () => {
  afterEach(() => {
    vol.reset();
  });

  it(`returns null in a JS only project`, async () => {
    vol.fromJSON({
      '/app.js': 'noop',
    });
    const prerequisite = new TypeScriptProjectPrerequisite('/');
    expect(await prerequisite._getSetupRequirements()).toBe(null);
  });
  it(`returns something in a project with TS files`, async () => {
    vol.fromJSON({
      '/somn.ts': '',
    });
    const prerequisite = new TypeScriptProjectPrerequisite('/');
    expect(await prerequisite._getSetupRequirements()).toStrictEqual({ isBootstrapping: true });
  });
  it(`is bootstrapping a project with a blank tsconfig`, async () => {
    vol.fromJSON({
      '/tsconfig.json': '',
    });
    const prerequisite = new TypeScriptProjectPrerequisite('/');
    expect(await prerequisite._getSetupRequirements()).toStrictEqual({ isBootstrapping: true });
  });
  it(`is bootstrapping a project with an empty object in the tsconfig`, async () => {
    vol.fromJSON({
      '/tsconfig.json': '{}',
    });
    const prerequisite = new TypeScriptProjectPrerequisite('/');
    expect(await prerequisite._getSetupRequirements()).toStrictEqual({ isBootstrapping: true });
  });

  it(`is a TypeScript project`, async () => {
    vol.fromJSON({
      '/tsconfig.json': '{ foo: true }',
    });
    const prerequisite = new TypeScriptProjectPrerequisite('/');
    expect(await prerequisite._getSetupRequirements()).toStrictEqual({ isBootstrapping: false });
  });
});
