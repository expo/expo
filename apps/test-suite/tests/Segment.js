'use strict';

import * as Segment from 'expo-analytics-segment';
import Constants from 'expo-constants';
export const name = 'Segment';

const ANDROID_WRITE_KEY = 'android-write-key';
const IOS_WRITE_KEY = 'ios-write-key';

export function test(t) {
  t.describe('Segment initialization', () => {
    t.it('works on all platforms', () => {
      t.expect(
        Segment.initialize({
          androidWriteKey: ANDROID_WRITE_KEY,
          iosWriteKey: IOS_WRITE_KEY,
        })
      ).toBe(undefined);
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

    t.it('group(groupId)', () => {
      t.expect(Segment.group('testSuiteGroupId')).toBe(undefined);
    });

    t.it('groupWithTraits(groupId, traits)', () => {
      t.expect(Segment.groupWithTraits('testSuiteGroupId', { trait: true })).toBe(undefined);
    });

    t.it('track(event)', () => {
      t.expect(Segment.track('event')).toBe(undefined);
    });

    t.it('trackWithProperties(event, properties)', () => {
      t.expect(
        Segment.trackWithProperties('event', {
          some: 'properties',
          nested: { object: { purposeOfLife: 42 } },
        })
      ).toBe(undefined);
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
      t.expect(() => {
        // eslint-disable-next-line import/namespace
        Segment.doesNotExist();
      }).toThrow();
    });
  });

  t.describe('Segment.enabled state toggle', () => {
    t.it('Segment.getEnabledAsync() returns true', async () => {
      const enabled = await Segment.getEnabledAsync();
      t.expect(enabled).toBe(true);
    });

    if (Constants.appOwnership === 'expo') {
      t.it('Segment.setEnabledAsync() rejects with a meaningful message', async () => {
        let error = null;
        try {
          await Segment.setEnabledAsync(false);
        } catch (e) {
          error = e;
        }
        t.expect(error).not.toBeNull();
        t.expect(error).toMatch('not supported in Expo Go');
      });
    }
  });

  t.describe('Segment.alias', () => {
    t.it('resolves when no options passed', async () => {
      await Segment.alias('testSuiteId');
    });

    t.it('resolves when some options passed', async () => {
      await Segment.alias('testSuiteId', {
        'Google Analytics Integration Key': { enabled: false },
      });
    });
  });
}
