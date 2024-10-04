'use strict';
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

import { waitFor } from './helpers';
import ExponentTest from '../ExponentTest';

export const name = 'Speech';

// const longTextToSpeak = 'One ring to rule them all.';
const shortTextToSpeak = 'Hi!';

// Some of the tests consistently fail on Android:
// on one device: onStart and onDone never get called,
// on another device: onDone and onStopped never get called.
// #Android

export function test(t) {
  // NOTE(2018-03-08): These tests are failing on iOS; disable for CI
  const unreliablyDescribe =
    Platform.OS !== 'android' && ExponentTest.isInCI ? t.xdescribe : t.describe;
  unreliablyDescribe('Speech', () => {
    t.describe('Speech.speak()', () => {
      t.it('calls onStart', async () => {
        const onStart = t.jasmine.createSpy('onStart');
        Speech.speak(shortTextToSpeak, { onStart });
        await waitFor(
          Platform.select({
            web: 1000,
            android: 1500,
            default: 500,
          })
        );
        t.expect(onStart).toHaveBeenCalled();
        Speech.stop();
      });

      t.it('calls onDone', async () => {
        const onDone = t.jasmine.createSpy('onDone');
        Speech.speak(shortTextToSpeak, { onDone });
        await waitFor(
          Platform.select({
            web: 1500,
            android: 1500,
            default: 1000,
          })
        );
        t.expect(onDone).toHaveBeenCalled();
        Speech.stop();
      });

      t.it("speaks with voice and doesn't throw", async () => {
        const [voice] = await Speech.getAvailableVoicesAsync();
        t.expect(voice).toBeDefined();

        const onError = t.jasmine.createSpy('onError');

        await new Promise((resolve, reject) => {
          try {
            Speech.speak(shortTextToSpeak, { onError, onDone: resolve, voice: voice.identifier });
          } catch (error) {
            reject(error);
          }
        });

        t.expect(onError).not.toHaveBeenCalled();
        Speech.stop();
      });

      if (Platform.OS !== 'ios') {
        t.it("doesn't call onError if not needed", async () => {
          const onError = t.jasmine.createSpy('onError');
          const language = 'en-US';
          await new Promise((resolve, reject) => {
            try {
              Speech.speak(shortTextToSpeak, { onError, language, onDone: resolve });
            } catch (error) {
              reject(error);
            }
          });
          t.expect(onError).not.toHaveBeenCalled();
          Speech.stop();
        });

        // Actually it throws a big red exception instead of rejecting the promise.
        // t.it('calls onError if language is invalid', async () => {
        //   const onError = t.jasmine.createSpy('onError');
        //   const language = 'nonexistentlanguage';
        //   try {
        //     Speech.speak('Short', { onError, language });
        //     await new Promise(resolve =>
        //       setTimeout(() => {
        //         t.expect(onError).toHaveBeenCalled();
        //         resolve();
        //       }, 1000)
        //     );
        //     Speech.stop();
        //   } catch (error) {
        //     t.fail(error);
        //   }
        // });
      }
    });

    /*t.describe('Speech.stop()', () => {
      t.it('calls onStopped', async () => {
        const onStopped = t.jasmine.createSpy('onStopped');
        Speech.speak(longTextToSpeak, { onStopped });
        await waitFor(500);
        const isSpeaking = await Speech.isSpeakingAsync();
        t.expect(isSpeaking).toBe(true);
        Speech.stop();
        await waitFor(1000);
        t.expect(onStopped).toHaveBeenCalled();
      });
    });*/

    t.describe('Speech.isSpeakingAsync()', () => {
      // It takes some time for Speech.stop to stop the utility,
      // so the order has to be:
      // 1. check when not speaking,
      // 2. check when speaking.
      // Or one could sleep at the end of the "when speaking" check.

      t.it("resolves to false if the utility isn't speaking", async () => {
        const isSpeaking = await Speech.isSpeakingAsync();
        t.expect(isSpeaking).toBe(false);
      });

      /*t.it('resolves to true if the utility is speaking', async () => {
        Speech.speak(longTextToSpeak);
        const isSpeaking = await Speech.isSpeakingAsync();
        t.expect(isSpeaking).toBe(true);
        Speech.stop();
      });*/
    });

    t.describe('Speech.getAvailableVoicesAsync()', () => {
      t.it('has voice with language tag', async () => {
        const voices = await Speech.getAvailableVoicesAsync();

        t.expect(voices.length).toBeGreaterThan(0);

        t.expect(voices.map((voice) => voice.language)).toContain('en-US');
      });
    });
  });
}
