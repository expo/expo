import { vol } from 'memfs';

import { shouldSetupTypeScriptAsync } from '../ensureTypeScriptSetup';

jest.mock('resolve-from');

describe(shouldSetupTypeScriptAsync, () => {
  afterEach(() => {
    vol.reset();
  });

  it(`returns null in a JS only project`, async () => {
    vol.fromJSON({
      '/app.js': 'noop',
    });

    expect(await shouldSetupTypeScriptAsync('/')).toBe(null);
  });
  it(`returns something in a project with TS files`, async () => {
    vol.fromJSON({
      '/somn.ts': '',
    });

    expect(await shouldSetupTypeScriptAsync('/')).toStrictEqual({ isBootstrapping: true });
  });
  it(`is bootstrapping a project with a blank tsconfig`, async () => {
    vol.fromJSON({
      '/tsconfig.json': '',
    });

    expect(await shouldSetupTypeScriptAsync('/')).toStrictEqual({ isBootstrapping: true });
  });
  it(`is bootstrapping a project with an empty object in the tsconfig`, async () => {
    vol.fromJSON({
      '/tsconfig.json': '{}',
    });

    expect(await shouldSetupTypeScriptAsync('/')).toStrictEqual({ isBootstrapping: true });
  });

  it(`is a TypeScript project`, async () => {
    vol.fromJSON({
      '/tsconfig.json': '{ foo: true }',
    });

    expect(await shouldSetupTypeScriptAsync('/')).toStrictEqual({ isBootstrapping: false });
  });
});
