import os from 'os';

import { getContext } from '../rudderstackClient';

jest.mock('ci-info', () => ({ isCI: true, isPR: true, name: 'GitHub Actions' }));

describe(getContext, () => {
  const originalVersion = process.env.__EXPO_VERSION;
  const knownPlatformNames = {
    darwin: 'Mac',
    linux: 'Linux',
    win32: 'Windows',
  };

  beforeEach(() => {
    delete process.env.__EXPO_VERSION;
  });

  afterAll(() => {
    process.env.__EXPO_VERSION = originalVersion;
  });

  it('contains os name and version', () => {
    expect(getContext().os).toMatchObject({
      name: knownPlatformNames[os.platform()] || os.platform(),
      version: os.release(),
    });
  });

  it('contains device type and model', () => {
    expect(getContext().device).toMatchObject({
      type: knownPlatformNames[os.platform()] || os.platform(),
      model: knownPlatformNames[os.platform()] || os.platform(),
    });
  });

  it('contains app name and version', () => {
    process.env.__EXPO_VERSION = '1337';
    expect(getContext().app).toMatchObject({
      name: 'expo',
      version: '1337',
    });
  });

  it('contains ci name and if its executed from PR', () => {
    expect(getContext().ci).toMatchObject({
      name: 'GitHub Actions',
      isPr: true,
    });
  });
});
