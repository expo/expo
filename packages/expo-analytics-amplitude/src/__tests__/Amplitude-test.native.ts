import { NativeModulesProxy } from 'expo-modules-core';

import * as Amplitude from '../Amplitude';

const { ExpoAmplitude } = NativeModulesProxy;

describe('all Amplitude methods available', () => {
  it(`initializes`, async () => {
    expect(Amplitude.initializeAsync('test-api-key')).resolves.not.toThrow();
    expect(ExpoAmplitude.initializeAsync).toHaveBeenCalledTimes(1);
  });

  it(`can setUserId`, async () => {
    expect(Amplitude.setUserIdAsync('user-id')).resolves.not.toThrow();
    expect(ExpoAmplitude.setUserIdAsync).toHaveBeenCalledWith('user-id');
  });

  it(`can setUserProperties`, async () => {
    expect(Amplitude.setUserPropertiesAsync({ some: 'property' })).resolves.not.toThrow();
    expect(ExpoAmplitude.setUserPropertiesAsync).toHaveBeenCalledWith({
      some: 'property',
    });
  });

  it(`can clearUserProperties`, async () => {
    expect(Amplitude.clearUserPropertiesAsync()).resolves.not.toThrow();
    expect(ExpoAmplitude.clearUserPropertiesAsync).toHaveBeenCalledTimes(1);
  });

  it(`can logEvent`, async () => {
    expect(Amplitude.logEventAsync('event-name')).resolves.not.toThrow();
    expect(ExpoAmplitude.logEventAsync).toHaveBeenCalledWith('event-name');
  });

  it(`can logEventWithProperties`, async () => {
    expect(
      Amplitude.logEventWithPropertiesAsync('event-name', { some: 'property' })
    ).resolves.not.toThrow();
    expect(ExpoAmplitude.logEventWithPropertiesAsync).toHaveBeenCalledWith('event-name', {
      some: 'property',
    });
  });

  it(`can setGroup`, async () => {
    expect(Amplitude.setGroupAsync('group', ['group', 'names', 'array'])).resolves.not.toThrow();
    expect(ExpoAmplitude.setGroupAsync).toHaveBeenCalledWith('group', ['group', 'names', 'array']);
  });
});
