import os from 'os';

import {
  getContext,
  getRudderAnalyticsClient,
  logEventAsync,
  resetInternalStateForTesting,
  setUserDataAsync,
} from '../rudderstackClient';

jest.mock('ci-info', () => ({ isCI: true, isPR: true, name: 'GitHub Actions' }));

jest.mock('@expo/rudder-sdk-node');

describe(logEventAsync, () => {
  beforeEach(() => {
    resetInternalStateForTesting();
  });

  it('logs when the user has been identified', async () => {
    await setUserDataAsync('fake', {});
    await logEventAsync('Start Project');
    expect(getRudderAnalyticsClient().track).toHaveBeenCalledWith({
      anonymousId: expect.any(String),
      context: getContext(),
      event: 'Start Project',
      properties: { source: 'expo', source_version: undefined },
      userId: 'fake',
    });
  });

  it('does not log when the user has not been identified', async () => {
    await logEventAsync('Start Project');
    expect(getRudderAnalyticsClient().track).not.toHaveBeenCalled();
  });
});

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
