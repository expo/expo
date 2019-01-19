import { UnavailabilityError } from 'expo-errors';
import { Platform } from 'expo-core';
import * as Haptic from '../Haptic/Haptic';

const unavailableMessage = `is unavailable on ${Platform.OS}`;

async function executeFailingMethod(method, name) {
  try {
    await method();
    expect(name).toBe('a failing method');
  } catch (error) {
    expect(error instanceof UnavailabilityError).toBeTruthy();
  }
}

describe('Haptic', () => {
  if (Platform.OS === 'ios') {
    describe('selection()', () => {
      it("Doesn't throw an error", async () => {
        let resultingError;
        try {
          await Haptic.selection();
        } catch (error) {
          resultingError = error;
        }
        expect(resultingError).toBeUndefined();
      });
    });
    describe('impact()', () => {
      it("Doesn't throw an error", async () => {
        let resultingError;
        try {
          await Haptic.impact();
        } catch (error) {
          resultingError = error;
        }
        expect(resultingError).toBeUndefined();
      });
      it('Throws an error when an unexpected type is provided', async () => {
        let resultingError;
        try {
          await Haptic.impact('James Ide' as any);
        } catch (error) {
          resultingError = error;
        }
        expect(resultingError).toBeDefined();
      });
      it('Can perform any impact style', async () => {
        const { Light, Medium, Heavy } = Haptic.ImpactFeedbackStyle;
        for (const style of [Light, Medium, Heavy]) {
          let resultingError;
          try {
            await Haptic.impact(style as Haptic.ImpactFeedbackStyle);
          } catch (error) {
            resultingError = error;
          }
          expect(resultingError).toBeUndefined();
        }
      });
    });
    describe('notification()', () => {
      it("Doesn't throw an error", async () => {
        let resultingError;
        try {
          await Haptic.notification();
        } catch (error) {
          resultingError = error;
        }
        expect(resultingError).toBeUndefined();
      });
      it('Throws an error when an unexpected type is provided', async () => {
        let resultingError;
        try {
          await Haptic.notification('SSBU' as any);
        } catch (error) {
          resultingError = error;
        }
        expect(resultingError).toBeDefined();
      });
      it('Can perform any notification type', async () => {
        const { Warning, Success, Error } = Haptic.NotificationFeedbackType;
        for (const type of [Warning, Success, Error]) {
          let resultingError;
          try {
            await Haptic.notification(type);
          } catch (error) {
            resultingError = error;
          }
          expect(resultingError).toBeUndefined();
        }
      });
    });
  } else {
    ['selection', 'impact', 'notification'].map(unsupportedMethod => {
      describe(`Haptic.${unsupportedMethod}()`, () => {
        it(unavailableMessage, () =>
          executeFailingMethod(Haptic[unsupportedMethod], unsupportedMethod)
        );
      });
    });
  }
});
