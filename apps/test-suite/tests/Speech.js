'use strict';
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

import { waitFor } from './helpers';

// Some of the tests consistently fail on Android:
// on one device: onStart and onDone never get called,
// on another device: onDone and onStopped never get called.
// #Android

export const name = 'Speech';

const longTextToSpeak = 'One ring to rule them all.';
const shortTextToSpeak = 'Hi!';

export function canRunAsync({ isAutomated }) {
  // NOTE(2018-03-08): These tests are failing on iOS; disable for CI
  return !isAutomated;
}

export function test({ describe, xdescribe, fail, afterEach, it, expect, jasmine }) {
  describe('Speech.speak()', () => {
    it('calls onStart', async () => {
      const onStart = jasmine.createSpy('onStart');
      Speech.speak(shortTextToSpeak, { onStart });
      await waitFor(
        Platform.select({
          web: 1000,
          default: 500,
        })
      );
      expect(onStart).toHaveBeenCalled();
      Speech.stop();
    });

    it("speaks with voice and doesn't throw", async () => {
      const [voice] = await Speech.getAvailableVoicesAsync();
      expect(voice).toBeDefined();

      const onError = jasmine.createSpy('onError');

      await new Promise((resolve, reject) => {
        try {
          Speech.speak(shortTextToSpeak, { onError, onDone: resolve, voice: voice.identifier });
        } catch (error) {
          reject(error);
        }
      });

      expect(onError).not.toHaveBeenCalled();
      Speech.stop();
    });

    if (Platform.OS !== 'ios') {
      it("doesn't call onError if not needed", async () => {
        const onError = jasmine.createSpy('onError');
        const language = 'en-US';
        await new Promise((resolve, reject) => {
          try {
            Speech.speak(shortTextToSpeak, { onError, language, onDone: resolve });
          } catch (error) {
            reject(error);
          }
        });
        expect(onError).not.toHaveBeenCalled();
        Speech.stop();
      });
    }

    // Actually it throws a big red exception instead of rejecting the promise.
    // it('calls onError if language is invalid', async () => {
    //   const onError = jasmine.createSpy('onError');
    //   const language = 'nonexistentlanguage';
    //   try {
    //     Speech.speak('Short', { onError, language });
    //     await new Promise(resolve =>
    //       setTimeout(() => {
    //         expect(onError).toHaveBeenCalled();
    //         resolve();
    //       }, 1000)
    //     );
    //     Speech.stop();
    //   } catch (error) {
    //     fail(error);
    //   }
    // });
  });

  /*describe('Speech.stop()', () => {
      it('calls onStopped', async () => {
        const onStopped = jasmine.createSpy('onStopped');
        Speech.speak(longTextToSpeak, { onStopped });
        await waitFor(500);
        const isSpeaking = await Speech.isSpeakingAsync();
        expect(isSpeaking).toBe(true);
        Speech.stop();
        await waitFor(1000);
        expect(onStopped).toHaveBeenCalled();
      });
    });*/

  describe('Speech.isSpeakingAsync()', () => {
    // It takes some time for Speech.stop to stop the utility,
    // so the order has to be:
    // 1. check when not speaking,
    // 2. check when speaking.
    // Or one could sleep at the end of the "when speaking" check.

    it("resolves to false if the utility isn't speaking", async () => {
      const isSpeaking = await Speech.isSpeakingAsync();
      expect(isSpeaking).toBe(false);
    });

    /*it('resolves to true if the utility is speaking', async () => {
        Speech.speak(longTextToSpeak);
        const isSpeaking = await Speech.isSpeakingAsync();
        expect(isSpeaking).toBe(true);
        Speech.stop();
      });*/
  });

  describe('Speech.getAvailableVoicesAsync()', () => {
    it('has voice with language tag', async () => {
      const voices = await Speech.getAvailableVoicesAsync();

      expect(voices.length).toBeGreaterThan(0);

      expect(voices.map(voice => voice.language)).toContain('en-US');
    });
  });
}
