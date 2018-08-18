'use strict';

import { Segment } from 'expo';

export const name = 'Segment';

const ANDROID_WRITE_KEY = 'android-write-key';
const IOS_WRITE_KEY = 'ios-write-key';

export function test(t) {
  t.describe('Segment initialization', () => {
    t.it('works on all platforms', () => {
      t
        .expect(
          Segment.initialize({
            androidWriteKey: ANDROID_WRITE_KEY,
            iosWriteKey: IOS_WRITE_KEY,
          })
        )
        .toBe(undefined);
    });
  });

  t.describe('All segment methods are available', () => {
    // Initialize segment for this test
    Segment.initialize({
      androidWriteKey: ANDROID_WRITE_KEY,
      iosWriteKey: IOS_WRITE_KEY,
    });

    t.it('identify(userId)', () => {
      t.expect(Segment.identify('userId')).toBe(undefined);
    });

    t.it('identifyWithTraits(userId, traits)', () => {
      t.expect(Segment.identifyWithTraits('userId', { some: 'traits' })).toBe(undefined);
    });

    t.it('reset()', () => {
      t.expect(Segment.reset()).toBe(undefined);
    });

    t.it('track(event)', () => {
      t.expect(Segment.track('event')).toBe(undefined);
    });

    t.it('trackWithProperties(event, properties)', () => {
      t.expect(Segment.trackWithProperties('event', { some: 'properties' })).toBe(undefined);
    });

    t.it('screen(screenName)', () => {
      t.expect(Segment.screen('screenName')).toBe(undefined);
    });

    t.it('screenWithProperties(screenName, properties)', () => {
      t.expect(Segment.screenWithProperties('screenName', { some: 'properties' })).toBe(undefined);
    });

    t.it('flush()', () => {
      t.expect(Segment.flush()).toBe(undefined);
    });

    t.it('non-existant method fails', () => {
      t
        .expect(() => {
          Segment.doesNotExist();
        })
        .toThrow();
    });
  });
}
