'use strict';

import * as Segment from 'expo-analytics-segment';
import Constants from 'expo-constants';
export const name = 'Segment';

const ANDROID_WRITE_KEY = 'android-write-key';
const IOS_WRITE_KEY = 'ios-write-key';

export function test({ describe, afterEach, it, expect, jasmine, ...t }) {
  describe('Segment initialization', () => {
    it('works on all platforms', () => {
      expect(
        Segment.initialize({
          androidWriteKey: ANDROID_WRITE_KEY,
          iosWriteKey: IOS_WRITE_KEY,
        })
      ).toBe(undefined);
    });
  });

  describe('All segment methods are available', () => {
    // Initialize segment for this test
    Segment.initialize({
      androidWriteKey: ANDROID_WRITE_KEY,
      iosWriteKey: IOS_WRITE_KEY,
    });

    it('identify(userId)', () => {
      expect(Segment.identify('userId')).toBe(undefined);
    });

    it('identifyWithTraits(userId, traits)', () => {
      expect(Segment.identifyWithTraits('userId', { some: 'traits' })).toBe(undefined);
    });

    it('reset()', () => {
      expect(Segment.reset()).toBe(undefined);
    });

    it('group(groupId)', () => {
      expect(Segment.group('testSuiteGroupId')).toBe(undefined);
    });

    it('groupWithTraits(groupId, traits)', () => {
      expect(Segment.groupWithTraits('testSuiteGroupId', { trait: true })).toBe(undefined);
    });

    it('track(event)', () => {
      expect(Segment.track('event')).toBe(undefined);
    });

    it('trackWithProperties(event, properties)', () => {
      expect(
        Segment.trackWithProperties('event', {
          some: 'properties',
          nested: { object: { purposeOfLife: 42 } },
        })
      ).toBe(undefined);
    });

    it('screen(screenName)', () => {
      expect(Segment.screen('screenName')).toBe(undefined);
    });

    it('screenWithProperties(screenName, properties)', () => {
      expect(Segment.screenWithProperties('screenName', { some: 'properties' })).toBe(undefined);
    });

    it('flush()', () => {
      expect(Segment.flush()).toBe(undefined);
    });

    it('non-existant method fails', () => {
      expect(() => {
        Segment.doesNotExist();
      }).toThrow();
    });
  });

  describe('Segment.enabled state toggle', () => {
    it('Segment.getEnabledAsync() returns true', async () => {
      const enabled = await Segment.getEnabledAsync();
      expect(enabled).toBe(true);
    });

    if (Constants.appOwnership === 'expo') {
      it('Segment.setEnabledAsync() rejects with a meaningful message', async () => {
        let error = null;
        try {
          await Segment.setEnabledAsync(false);
        } catch (e) {
          error = e;
        }
        expect(error).not.toBeNull();
        expect(error).toMatch('not supported in Expo Client');
      });
    }
  });

  describe('Segment.alias', () => {
    it('resolves when no options passed', async () => {
      await Segment.alias('testSuiteId');
    });

    it('resolves when some options passed', async () => {
      await Segment.alias('testSuiteId', {
        'Google Analytics Integration Key': { enabled: false },
      });
    });
  });
}
