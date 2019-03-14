import { NativeModulesProxy } from '@unimodules/core';
import firebase from 'expo-firebase-app';

const { ExpoFirebaseAnalytics } = NativeModulesProxy;

describe('logEvent()', () => {
  it(`rejects reserved names`, () => {
    try {
      firebase.analytics().logEvent('session_start');
    } catch (e) {
      expect(e.message).toContainEqual('reserved event');
    }
  });

  it(`rejects non-alphanumeric names`, () => {
    try {
      firebase.analytics().logEvent('!@£$%^&*');
    } catch (e) {
      expect(e.message).toContainEqual('is invalid');
    }
  });

  it(`rejects more than 25 props`, () => {
    try {
      const output = {};
      for (const value of Array.from(Array(25).keys())) {
        output[value] = value;
      }
      firebase.analytics().logEvent('fooby', output);
    } catch (e) {
      expect(e.message).toContainEqual('Maximum number of parameters exceeded');
    }
  });

  it(`rejects non-string names`, () => {
    expect(firebase.analytics().logEvent(123456)).toThrow(
      `analytics.logEvent(): First argument 'name' is required and must be a string value.`
    );
  });

  it(`rejects non-object params`, () => {
    expect(firebase.analytics().logEvent('test_event', 'this should be an object')).toThrow(
      `analytics.logEvent(): Second optional argument 'params' must be an object if provided.`
    );
  });

  it(`logs an event without parameters`, () => {
    firebase.analytics().logEvent('test_event');
    expect(ExpoFirebaseAnalytics.logEvent).toHaveBeenLastCalledWith('test_event', {});
  });

  it(`logs an event with parameters`, () => {
    firebase.analytics().logEvent('test_event', {
      boolean: true,
      number: 1,
      string: 'string',
    });
  });
});

describe('setAnalyticsCollectionEnabled()', () => {
  it(`toggles as expected`, () => {
    firebase.analytics().setAnalyticsCollectionEnabled(true);
    expect(ExpoFirebaseAnalytics.setAnalyticsCollectionEnabled).toHaveBeenLastCalledWith(true);
    firebase.analytics().setAnalyticsCollectionEnabled(false);
    expect(ExpoFirebaseAnalytics.setAnalyticsCollectionEnabled).toHaveBeenLastCalledWith(false);
  });
});

describe('setCurrentScreen()', () => {
  it(`can set the screen name without an override class`, () => {
    const screenName = 'Expo Screen';
    firebase.analytics().setCurrentScreen(screenName);
    expect(ExpoFirebaseAnalytics.setCurrentScreen).toHaveBeenLastCalledWith(screenName);
  });
  it(`can override a class with a screen name`, () => {
    const screenName = 'Expo Screen';
    const override = 'EXViewController';
    firebase.analytics().setCurrentScreen(screenName, override);
    expect(ExpoFirebaseAnalytics.setCurrentScreen).toHaveBeenLastCalledWith(screenName, override);
  });
});

describe('setMinimumSessionDuration()', () => {
  it(`can set a custom duration`, () => {
    const defaultValue = 10000;
    firebase.analytics().setMinimumSessionDuration();
    expect(ExpoFirebaseAnalytics.setMinimumSessionDuration).toHaveBeenLastCalledWith(defaultValue);

    const customValue = 8000;
    firebase.analytics().setMinimumSessionDuration(customValue);
    expect(ExpoFirebaseAnalytics.setMinimumSessionDuration).toHaveBeenLastCalledWith(customValue);
  });
});

describe('setSessionTimeoutDuration()', () => {
  it('default duration', () => {
    firebase.analytics().setSessionTimeoutDuration();
  });

  it('custom duration', () => {
    firebase.analytics().setSessionTimeoutDuration(1800001);
  });
});

describe('setUserId()', () => {
  it('allows a null values to be set', () => {
    firebase.analytics().setUserId(null);
  });

  it('accepts string values', () => {
    firebase.analytics().setUserId('test-id');
  });

  it('rejects none string none null values', () => {
    try {
      firebase.analytics().setUserId(33.3333);
    } catch (e) {
      expect(e.message).toContainEqual('must be a string');
    }
  });
});

describe('setUserProperty()', () => {
  it('allows a null values to be set', () => {
    firebase.analytics().setUserProperty('fooby', null);
  });

  it('accepts string values', () => {
    firebase.analytics().setUserProperty('fooby2', 'test-id');
  });

  it('rejects none string none null values', () => {
    try {
      firebase.analytics().setUserProperty('fooby3', 33.3333);
    } catch (e) {
      expect(e.message).toContainEqual('must be a string');
    }
  });
});

describe('setUserProperties()', () => {
  it('allows a null values to be set', () => {
    firebase.analytics().setUserProperties({ fooby: null });
  });

  it('accepts string values', () => {
    firebase.analytics().setUserProperties({ fooby2: 'test-id' });
  });

  it('rejects none string none null values', () => {
    try {
      firebase.analytics().setUserProperties({ fooby3: 33.3333 });
    } catch (e) {
      expect(e.message).toContainEqual('must be a string');
    }
  });
});
