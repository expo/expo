import { UnavailabilityError } from 'expo-errors';
import { NativeModules, Platform } from 'react-native';

import {
  mockPlatformAndroid,
  mockPlatformWeb,
  mockProperty,
  unmockAllProperties,
} from '../../test/mocking';
import * as Haptic from '../Haptic/Haptic';

async function executeUnavailableMethod(method, name) {
  try {
    await method();
    expect(name).toBe('a failing method');
  } catch (error) {
    expect(error instanceof UnavailabilityError).toBeTruthy();
  }
}

function applyMocks() {
  mockPlatformWeb();
  ['selection', 'impact', 'notification'].forEach(methodName => {
    mockProperty(NativeModules.ExponentHaptic, methodName, null);
  });
}

describe('Haptic', () => {
  describe('iOS', () => {
    describe('selection()', () => {
      it("Doesn't throw an error", async () => {
        await Haptic.selection();
      });
    });
    describe('impact()', () => {
      it("Doesn't throw an error", async () => {
        await Haptic.impact();
      });
      it('Throws an error when an unexpected type is provided', async () => {
        const invalidInput: any = 'invalid input';
        expect(Haptic.impact(invalidInput)).rejects.toThrowError('Invariant Violation');
      });
      it('Can perform any impact style', async () => {
        const { Light, Medium, Heavy } = Haptic.ImpactFeedbackStyle;
        for (const style of [Light, Medium, Heavy]) {
          await Haptic.impact(style as Haptic.ImpactFeedbackStyle);
        }
      });
    });
    describe('notification()', () => {
      it("Doesn't throw an error", async () => {
        await Haptic.notification();
      });
      it('Throws an error when an unexpected type is provided', async () => {
        const invalidInput: any = 'invalid input';
        expect(Haptic.notification(invalidInput)).rejects.toThrowError('Invariant Violation');
      });
      it('Can perform any notification type', async () => {
        const { Warning, Success, Error } = Haptic.NotificationFeedbackType;
        for (const type of [Warning, Success, Error]) {
          await Haptic.notification(type);
        }
      });
    });
  });

  ['selection', 'impact', 'notification'].forEach(unsupportedMethod => {
    describeUnsupportedPlatforms(`Haptic.${unsupportedMethod}()`, () => {
      it(`is unavailable on ${Platform.OS}`, () => {
        executeUnavailableMethod(Haptic[unsupportedMethod], unsupportedMethod);
      });
    });
  });
});

export function describeUnsupportedPlatforms(message, tests) {
  describe(`🕸  ${message}`, () => {
    beforeEach(applyMocks);
    mockPlatformWeb();
    tests();
    afterAll(unmockAllProperties);
  });
  describe(`🤖 ${message}`, () => {
    beforeEach(applyMocks);
    mockPlatformAndroid();
    tests();
    afterAll(unmockAllProperties);
  });
}
