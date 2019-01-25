import { UnavailabilityError } from 'expo-errors';
import {
  mockPlatformAndroid,
  mockPlatformIOS,
  mockPlatformWeb,
  mockProperty,
  unmockAllProperties,
} from 'jest-expo';
import { NativeModules } from 'react-native';

import * as Haptic from '../Haptic/Haptic';

describe(' Haptic', () => {
  beforeEach(() => {
    mockPlatformIOS();
  });

  afterEach(() => {
    unmockAllProperties();
  });

  describe(`selection()`, () => {
    it(`doesn't throw an error`, async () => {
      await Haptic.selection();
    });
  });

  describe(`impact()`, () => {
    it(`doesn't throw an error`, async () => {
      await Haptic.impact();
    });

    it(`throws an error when an unexpected type is provided`, async () => {
      const invalidInput: any = 'invalid input';
      expect(Haptic.impact(invalidInput)).rejects.toThrowError('Invariant Violation');
    });

    it(`can perform any impact style`, async () => {
      const { Light, Medium, Heavy } = Haptic.ImpactFeedbackStyle;
      for (const style of [Light, Medium, Heavy]) {
        await Haptic.impact(style as Haptic.ImpactFeedbackStyle);
      }
    });
  });

  describe(`notification()`, () => {
    it(`doesn't throw an error`, async () => {
      await Haptic.notification();
    });

    it(`throws an error when an unexpected type is provided`, async () => {
      const invalidInput: any = 'invalid input';
      expect(Haptic.notification(invalidInput)).rejects.toThrowError('Invariant Violation');
    });

    it(`can perform any notification type`, async () => {
      const { Warning, Success, Error } = Haptic.NotificationFeedbackType;
      for (const type of [Warning, Success, Error]) {
        await Haptic.notification(type);
      }
    });
  });
});

const { selection, impact, notification } = Haptic;
const methods = {
  selection,
  impact,
  notification,
};
describeUnsupportedPlatforms(`Haptic`, () => {
  for (const methodName in methods) {
    describe(`${methodName}()`, () => {
      it(`is unavailable`, async () => {
        try {
          const method = methods[methodName];
          await method();
          expect(methodName).toBe('an unavailable method');
        } catch (error) {
          expect(error instanceof UnavailabilityError).toBeTruthy();
        }
      });
    });
  }
});

function applyMocks() {
  Object.keys(methods).forEach(methodName => {
    mockProperty(NativeModules.ExponentHaptic, methodName, null);
  });
}

export function describeUnsupportedPlatforms(message, tests) {
  describe(`🕸  ${message}`, () => {
    beforeEach(() => {
      applyMocks();
      mockPlatformWeb();
    });
    tests();
    afterEach(unmockAllProperties);
  });
  describe(`🤖 ${message}`, () => {
    beforeEach(() => {
      applyMocks();
      mockPlatformAndroid();
    });
    tests();
    afterEach(unmockAllProperties);
  });
}
