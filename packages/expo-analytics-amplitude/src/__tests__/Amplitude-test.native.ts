import { NativeModulesProxy } from '@unimodules/core';
import * as Amplitude from '../Amplitude';

const { ExpoAmplitude } = NativeModulesProxy;

describe('all Amplitude methods available', () => {
  it(`initializes`, () => {
    expect(Amplitude.initialize('test-api-key')).not.toBeUndefined();
    expect(ExpoAmplitude.initialize).toHaveBeenCalledTimes(1);
  });

  it(`can setUserId`, () => {
    expect(Amplitude.setUserId('user-id')).not.toBeUndefined();
    expect(ExpoAmplitude.setUserId).toHaveBeenCalledWith('user-id');
  });

  it(`can setUserProperties`, () => {
    expect(Amplitude.setUserProperties({ some: 'property' })).not.toBeUndefined();
    expect(ExpoAmplitude.setUserProperties).toHaveBeenCalledWith({
      some: 'property',
    });
  });

  it(`can clearUserProperties`, () => {
    expect(Amplitude.clearUserProperties()).not.toBeUndefined();
    expect(ExpoAmplitude.clearUserProperties).toHaveBeenCalledTimes(1);
  });

  it(`can logEvent`, () => {
    expect(Amplitude.logEvent('event-name')).not.toBeUndefined();
    expect(ExpoAmplitude.logEvent).toHaveBeenCalledWith('event-name');
  });

  it(`can logEventWithProperties`, () => {
    expect(
      Amplitude.logEventWithProperties('event-name', { some: 'property' })
    ).not.toBeUndefined();
    expect(ExpoAmplitude.logEventWithProperties).toHaveBeenCalledWith('event-name', {
      some: 'property',
    });
  });

  it(`can setGroup`, () => {
    expect(Amplitude.setGroup('group', ['group', 'names', 'array'])).not.toBeUndefined();
    expect(ExpoAmplitude.setGroup).toHaveBeenCalledWith('group', ['group', 'names', 'array']);
  });
});
