import { NativeModules } from 'react-native';
import Amplitude from '../Amplitude';

import { describeCrossPlatform } from '../../test/mocking';

describeCrossPlatform('all Amplitude methods available', () => {
  it('initializes', () => {
    expect(Amplitude.initialize('test-api-key')).toBeUndefined();
    expect(NativeModules.ExponentAmplitude.initialize).toHaveBeenCalledTimes(1);
  });

  it('can setUserId', () => {
    expect(Amplitude.setUserId('user-id')).toBeUndefined();
    expect(NativeModules.ExponentAmplitude.setUserId).toHaveBeenCalledWith('user-id');
  });

  it('can setUserProperties', () => {
    expect(Amplitude.setUserProperties({ some: 'property' })).toBeUndefined();
    expect(NativeModules.ExponentAmplitude.setUserProperties).toHaveBeenCalledWith({
      some: 'property',
    });
  });

  it('can clearUserProperties', () => {
    expect(Amplitude.clearUserProperties()).toBeUndefined();
    expect(NativeModules.ExponentAmplitude.clearUserProperties).toHaveBeenCalledTimes(1);
  });

  it('can logEvent', () => {
    expect(Amplitude.logEvent('event-name')).toBeUndefined();
    expect(NativeModules.ExponentAmplitude.logEvent).toHaveBeenCalledWith('event-name');
  });

  it('can logEventWithProperties', () => {
    expect(Amplitude.logEventWithProperties('event-name', { some: 'property' })).toBeUndefined();
    expect(NativeModules.ExponentAmplitude.logEventWithProperties).toHaveBeenCalledWith(
      'event-name',
      { some: 'property' }
    );
  });

  it('can setGroup', () => {
    expect(Amplitude.setGroup('group', ['group', 'names', 'array'])).toBeUndefined();
    expect(NativeModules.ExponentAmplitude.setGroup).toHaveBeenCalledWith('group', [
      'group',
      'names',
      'array',
    ]);
  });
});
