import { NativeModulesProxy } from '@unimodules/core';

import * as Amplitude from '../Amplitude';

const { ExpoAmplitude } = NativeModulesProxy;

describe('all Amplitude methods available', () => {
  it(`initializes`, () => {
    Amplitude.initialize('test-api-key');
    expect(ExpoAmplitude.initialize).toHaveBeenCalledTimes(1);
  });

  it(`can setUserId`, () => {
    Amplitude.setUserId('user-id');
    expect(ExpoAmplitude.setUserId).toHaveBeenCalledWith('user-id');
  });

  it(`can setUserProperties`, () => {
    Amplitude.setUserProperties({ some: 'property' });
    expect(ExpoAmplitude.setUserProperties).toHaveBeenCalledWith({
      some: 'property',
    });
  });

  it(`can clearUserProperties`, () => {
    Amplitude.clearUserProperties();
    expect(ExpoAmplitude.clearUserProperties).toHaveBeenCalledTimes(1);
  });

  it(`can logEvent`, async () => {
    await expect(Amplitude.logEventAsync('event-name')).resolves.not.toThrow();
    expect(ExpoAmplitude.logEventAsync).toHaveBeenCalledWith('event-name');
  });

  it(`can logEventWithProperties`, async () => {
    await expect(
      Amplitude.logEventWithPropertiesAsync('event-name', { some: 'property' })
    ).resolves.not.toThrow();
    expect(ExpoAmplitude.logEventWithPropertiesAsync).toHaveBeenCalledWith('event-name', {
      some: 'property',
    });
  });

  it(`can setGroup`, () => {
    Amplitude.setGroup('group', ['group', 'names', 'array']);
    expect(ExpoAmplitude.setGroup).toHaveBeenCalledWith('group', ['group', 'names', 'array']);
  });
});
