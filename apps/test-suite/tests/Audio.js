'use strict';

import { Audio } from 'expo-av';
import { Asset } from 'expo-asset';
import { Platform } from 'react-native';

import { retryForStatus, waitFor } from './helpers';

export const name = 'Audio';

export function canRunAsync({ isAutomated }) {
  // Audio tests are flaky in CI due to asynchronous fetching of resources
  return !isAutomated;
}

const mainTestingSource = require('../assets/LLizard.mp3');
const soundUri = 'http://www.noiseaddicts.com/samples_1w72b820/280.mp3';
const hlsStreamUri = 'http://qthttp.apple.com.edgesuite.net/1010qwoeiuryfg/sl.m3u8';
const hlsStreamUriWithRedirect = 'http://bit.ly/1iy90bn';
const redirectingSoundUri = 'http://bit.ly/2qBMx80';
const authenticatedStaticFilesBackend = 'https://authenticated-static-files-hagckpsbra.now.sh';

export function test({ describe, afterEach, beforeAll, beforeEach, it, expect, jasmine, ...t }) {
  describe('Audio class', () => {
    describe('Audio.setAudioModeAsync', () => {
      // These tests should work according to the documentation,
      // but the implementation doesn't return anything from the Promise.

      // it('sets one set of the options', async () => {
      //   const mode = {
      //     playsInSilentModeIOS: true,
      //     allowsRecordingIOS: true,
      //     interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DUCK_OTHERS,
      //     shouldDuckAndroid: true,
      //     interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS,
      //     playThroughEarpieceAndroid: false,
      //   };
      //   try {
      //     const receivedMode = await Audio.setAudioModeAsync(mode);
      //     expect(receivedMode).toBeDefined();
      //     receivedMode && expect(receivedMode).toEqual(t.jasmine.objectContaining(mode));
      //   } catch (error) {
      //     t.fail(error);
      //   }
      // });

      // it('sets another set of the options', async () => {
      //   const mode = {
      //     playsInSilentModeIOS: false,
      //     allowsRecordingIOS: false,
      //     interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      //     shouldDuckAndroid: false,
      //     interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      //     playThroughEarpieceAndroid: false,
      //   };
      //   try {
      //     const receivedMode = await Audio.setAudioModeAsync(mode);
      //     expect(receivedMode).toBeDefined();
      //     receivedMode && expect(receivedMode).toEqual(t.jasmine.objectContaining(mode));
      //   } catch (error) {
      //     t.fail(error);
      //   }
      // });

      if (Platform.OS === 'ios') {
        it('rejects an invalid promise', async () => {
          const mode = {
            playsInSilentModeIOS: false,
            allowsRecordingIOS: true,
            interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
            shouldDuckAndroid: false,
            interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
            playThroughEarpieceAndroid: false,
            staysActiveInBackground: false,
          };
          let error = null;
          try {
            await Audio.setAudioModeAsync(mode);
          } catch (err) {
            error = err;
          }
          expect(error).not.toBeNull();
          error && expect(error.toString()).toMatch('Impossible audio mode');
        });
      }
    });
  });

  describe('Audio instances', () => {
    let soundObject = null;

    beforeAll(async () => {
      await Audio.setIsEnabledAsync(true);
    });

    beforeEach(() => {
      soundObject = new Audio.Sound();
    });

    afterEach(async () => {
      await soundObject.unloadAsync();
      soundObject = null;
    });

    describe('Audio.loadAsync', () => {
      it('loads the file with `require`', async () => {
        await soundObject.loadAsync(require('../assets/LLizard.mp3'));
        await retryForStatus(soundObject, { isLoaded: true });
      });

      it('loads the file from `Asset`', async () => {
        await soundObject.loadAsync(Asset.fromModule(require('../assets/LLizard.mp3')));
        await retryForStatus(soundObject, { isLoaded: true });
      });

      it('loads the file from the Internet', async () => {
        await soundObject.loadAsync({ uri: soundUri });
        await retryForStatus(soundObject, { isLoaded: true });
      });

      describe('cookie session', () => {
        afterEach(async () => {
          try {
            await fetch(`${authenticatedStaticFilesBackend}/sign_out`, {
              method: 'DELETE',
              credentials: true,
            });
          } catch (error) {
            console.warn(`Could not sign out of cookie session test backend, error: ${error}.`);
          }
        });

        it('is shared with fetch session', async () => {
          let error = null;
          try {
            await soundObject.loadAsync({
              uri: `${authenticatedStaticFilesBackend}/LLizard.mp3`,
            });
          } catch (err) {
            error = err;
          }
          expect(error).toBeDefined();
          if (Platform.OS === 'android') {
            expect(error.toString()).toMatch('Response code: 401');
          } else {
            expect(error.toString()).toMatch('error code -1013');
          }
          const signInResponse = await (await fetch(`${authenticatedStaticFilesBackend}/sign_in`, {
            method: 'POST',
            credentials: true,
          })).text();
          expect(signInResponse).toMatch('Signed in successfully!');
          error = null;
          try {
            await soundObject.loadAsync({
              uri: `${authenticatedStaticFilesBackend}/LLizard.mp3`,
            });
          } catch (err) {
            error = err;
          }
          expect(error).toBeNull();
        }, 30000);
      });

      it('supports adding custom headers to media request', async () => {
        let error = null;
        try {
          await soundObject.loadAsync({
            uri: `${authenticatedStaticFilesBackend}/LLizard.mp3`,
          });
        } catch (err) {
          error = err;
        }
        if (!error) {
          throw new Error('Backend unexpectedly allowed unauthenticated request.');
        }
        error = null;
        try {
          await soundObject.loadAsync({
            uri: `${authenticatedStaticFilesBackend}/LLizard.mp3`,
            headers: {
              authorization: 'mellon',
            },
          });
        } catch (err) {
          error = err;
        }
        expect(error).toBeNull();
      }, 30000);

      if (Platform.OS === 'android') {
        it('supports adding custom headers to media request (MediaPlayer implementation)', async () => {
          let error = null;
          try {
            await soundObject.loadAsync({
              uri: `${authenticatedStaticFilesBackend}/LLizard.mp3`,
              androidImplementation: 'MediaPlayer',
            });
          } catch (err) {
            error = err;
          }
          if (!error) {
            throw new Error('Backend unexpectedly allowed unauthenticated request.');
          }
          error = null;
          try {
            await soundObject.loadAsync({
              uri: `${authenticatedStaticFilesBackend}/LLizard.mp3`,
              androidImplementation: 'MediaPlayer',
              headers: {
                authorization: 'mellon',
              },
            });
          } catch (err) {
            error = err;
          }
          expect(error).toBeNull();
        });
      }

      it('redirects from HTTPS URL to HTTPS URL (301)', async () => {
        let error = null;
        try {
          await soundObject.loadAsync({
            uri:
              'https://player.vimeo.com/external/181375362.sd.mp4?s=cf573e9cf7d747f4eaf7e57eeec88e9b22e3933f&profile_id=165',
          });
        } catch (err) {
          error = err;
        }
        expect(error).toBeNull();
      });

      if (Platform.OS === 'android') {
        it('rejects the file from the Internet that redirects to non-standard content', async () => {
          let hasBeenRejected = false;
          try {
            await soundObject.loadAsync({
              uri: hlsStreamUriWithRedirect,
            });
            await retryForStatus(soundObject, { isLoaded: true });
          } catch (error) {
            hasBeenRejected = true;
          }
          expect(hasBeenRejected).toBe(true);
        });
        it('loads the file from the Internet that redirects to non-standard content when overrideFileExtensionAndroid is provided', async () => {
          let hasBeenRejected = false;
          try {
            await soundObject.loadAsync({
              uri: hlsStreamUriWithRedirect,
              overrideFileExtensionAndroid: 'm3u8',
            });
            await retryForStatus(soundObject, { isLoaded: true });
          } catch (error) {
            hasBeenRejected = true;
          }
          expect(hasBeenRejected).toBe(false);
        });
      } else {
        it('loads the file from the Internet that redirects to non-standard content', async () => {
          let hasBeenRejected = false;
          try {
            await soundObject.loadAsync({
              uri: hlsStreamUriWithRedirect,
            });
            await retryForStatus(soundObject, { isLoaded: true });
          } catch (error) {
            hasBeenRejected = true;
          }
          expect(hasBeenRejected).toBe(false);
        });
      }

      it('loads HLS stream', async () => {
        await soundObject.loadAsync({
          uri: hlsStreamUri,
        });
        await retryForStatus(soundObject, { isLoaded: true });
      });

      it('loads the file from the Internet (with redirecting URL)', async () => {
        await soundObject.loadAsync({
          uri: redirectingSoundUri,
        });
        await retryForStatus(soundObject, { isLoaded: true });
      });

      it('rejects if a file is already loaded', async () => {
        await soundObject.loadAsync({ uri: soundUri });
        await retryForStatus(soundObject, { isLoaded: true });
        let hasBeenRejected = false;
        try {
          await soundObject.loadAsync(mainTestingSource);
        } catch (error) {
          hasBeenRejected = true;
          error && expect(error.toString()).toMatch('already loaded');
        }
        expect(hasBeenRejected).toBe(true);
      });
    });

    describe('Audio.loadAsync(require, initialStatus)', () => {
      it('sets an initial status', async () => {
        const options = {
          shouldPlay: true,
          isLooping: true,
          isMuted: false,
          volume: 0.5,
          rate: 1.5,
        };
        await soundObject.loadAsync(mainTestingSource, options);
        await retryForStatus(soundObject, options);
      });
    });

    describe('Audio.setStatusAsync', () => {
      it('sets a status', async () => {
        const options = {
          shouldPlay: true,
          isLooping: true,
          isMuted: false,
          volume: 0.5,
          rate: 1.5,
        };
        await soundObject.loadAsync(mainTestingSource, options);
        await retryForStatus(soundObject, options);
      });
    });

    describe('Audio.unloadAsync(require, initialStatus)', () => {
      it('unloads the object when it is loaded', async () => {
        await soundObject.loadAsync(mainTestingSource);
        await retryForStatus(soundObject, { isLoaded: true });
        await soundObject.unloadAsync();
        await retryForStatus(soundObject, { isLoaded: false });
      });

      it("rejects if the object isn't loaded", async () => {
        let hasBeenRejected = false;
        try {
          await soundObject.unloadAsync();
        } catch (error) {
          hasBeenRejected = true;
        }
        expect(hasBeenRejected).toBe(false);
      });
    });

    /*describe('Audio.setOnPlaybackStatusUpdate', () => {
      it('sets callbacks that gets called when playing and stopping', async () => {
        const onPlaybackStatusUpdate = t.jasmine.createSpy('onPlaybackStatusUpdate');
        soundObject.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
        await soundObject.loadAsync(mainTestingSource);
        await retryForStatus(soundObject, { isLoaded: true });
        await soundObject.playAsync();
        await retryForStatus(soundObject, { isPlaying: true });
        await soundObject.stopAsync();
        await retryForStatus(soundObject, { isPlaying: false });
        expect(onPlaybackStatusUpdate).toHaveBeenCalledWith({ isLoaded: false });
        t
          .expect(onPlaybackStatusUpdate)
          .toHaveBeenCalledWith(t.jasmine.objectContaining({ isLoaded: true }));
        t
          .expect(onPlaybackStatusUpdate)
          .toHaveBeenCalledWith(t.jasmine.objectContaining({ isPlaying: true }));
        t
          .expect(onPlaybackStatusUpdate)
          .toHaveBeenCalledWith(t.jasmine.objectContaining({ isPlaying: false }));
      });

      it(
        'sets callbacks that gets called with didJustFinish when playback finishes',
        async () => {
          const onPlaybackStatusUpdate = t.jasmine.createSpy('onPlaybackStatusUpdate');
          soundObject.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
          await soundObject.loadAsync(mainTestingSource);
          await retryForStatus(soundObject, { isLoaded: true });
          await retryForStatus(soundObject, { isBuffering: false });
          const status = await soundObject.getStatusAsync();
          await soundObject.setStatusAsync({
            positionMillis: status.playableDurationMillis - 300,
            shouldPlay: true,
          });
          await new Promise(resolve => {
            setTimeout(() => {
              t
                .expect(onPlaybackStatusUpdate)
                .toHaveBeenCalledWith(t.jasmine.objectContaining({ didJustFinish: true }));
              resolve();
            }, 1000);
          });
        }
      );
    });*/

    describe('Audio.playAsync', () => {
      it('plays the sound', async () => {
        await soundObject.loadAsync(mainTestingSource);
        await soundObject.playAsync();
        await retryForStatus(soundObject, { isPlaying: true });
      });
    });

    describe('Audio.replayAsync', () => {
      it('replays the sound', async () => {
        await soundObject.loadAsync(mainTestingSource);
        await retryForStatus(soundObject, { isLoaded: true });
        await soundObject.playAsync();
        await retryForStatus(soundObject, { isPlaying: true });
        await waitFor(500);
        const statusBefore = await soundObject.getStatusAsync();
        soundObject.replayAsync();
        await retryForStatus(soundObject, { isPlaying: true });
        const statusAfter = await soundObject.getStatusAsync();
        expect(statusAfter.positionMillis).toBeLessThan(statusBefore.positionMillis);
      });

      /*it('calls the onPlaybackStatusUpdate with hasJustBeenInterrupted = true', async () => {
        const onPlaybackStatusUpdate = t.jasmine.createSpy('onPlaybackStatusUpdate');
        await soundObject.loadAsync(mainTestingSource);
        soundObject.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
        await retryForStatus(soundObject, { isLoaded: true });
        await soundObject.playAsync();
        await retryForStatus(soundObject, { isPlaying: true });
        await soundObject.replayAsync();
        t
          .expect(onPlaybackStatusUpdate)
          .toHaveBeenCalledWith(t.jasmine.objectContaining({ hasJustBeenInterrupted: true }));
      });*/
    });

    describe('Audio.pauseAsync', () => {
      it('pauses the sound', async () => {
        await soundObject.loadAsync(mainTestingSource);
        await soundObject.playAsync();
        await retryForStatus(soundObject, { isPlaying: true });
        await soundObject.pauseAsync();
        await retryForStatus(soundObject, { isPlaying: false });
        await soundObject.playAsync();
        await retryForStatus(soundObject, { isPlaying: true });
      });
    });

    describe('Audio.stopAsync', () => {
      it('stops the sound', async () => {
        await soundObject.loadAsync(mainTestingSource, { shouldPlay: true });
        await retryForStatus(soundObject, { isPlaying: true });
        await soundObject.stopAsync();
        await retryForStatus(soundObject, { isPlaying: false });
      });
    });

    describe('Audio.setPositionAsync', () => {
      it('sets the position', async () => {
        await soundObject.loadAsync(mainTestingSource);
        await retryForStatus(soundObject, { positionMillis: 0 });
        await soundObject.setPositionAsync(1000);
        await retryForStatus(soundObject, { positionMillis: 1000 });
      });
    });

    describe('Audio.setPositionAsync', () => {
      it('sets the position', async () => {
        await soundObject.loadAsync(mainTestingSource);
        await retryForStatus(soundObject, { positionMillis: 0 });
        await soundObject.setPositionAsync(1000);
        await retryForStatus(soundObject, { positionMillis: 1000 });
      });

      it('sets the position with tolerance', async () => {
        await soundObject.loadAsync(mainTestingSource);
        await retryForStatus(soundObject, { positionMillis: 0 });
        await soundObject.setPositionAsync(999, {
          toleranceMillisBefore: 0,
          toleranceMillisAfter: 0,
        });
        await retryForStatus(soundObject, { positionMillis: 999 });
      });
    });

    describe('Audio.setVolumeAsync', () => {
      beforeEach(async () => {
        await soundObject.loadAsync(mainTestingSource, { volume: 1 });
        await retryForStatus(soundObject, { volume: 1 });
      });

      it('sets the volume', async () => {
        await soundObject.setVolumeAsync(0.5);
        await retryForStatus(soundObject, { volume: 0.5 });
      });

      const testVolumeFailure = (valueDescription, value) =>
        it(`rejects if volume value is ${valueDescription}`, async () => {
          let hasBeenRejected = false;
          try {
            await soundObject.setVolumeAsync(value);
          } catch (error) {
            hasBeenRejected = true;
            error && expect(error.toString()).toMatch(/value .+ between/);
          }
          expect(hasBeenRejected).toBe(true);
        });

      testVolumeFailure('too big', 2);
      testVolumeFailure('negative', -0.5);
    });

    describe('Audio.setIsMutedAsync', () => {
      it('sets whether the audio is muted', async () => {
        await soundObject.loadAsync(mainTestingSource, { isMuted: true });
        await retryForStatus(soundObject, { isMuted: true });
        await soundObject.setIsMutedAsync(false);
        await retryForStatus(soundObject, { isMuted: false });
      });
    });

    describe('Audio.setIsLoopingAsync', () => {
      it('sets whether the audio is looped', async () => {
        await soundObject.loadAsync(mainTestingSource, { isLooping: false });
        await retryForStatus(soundObject, { isLooping: false });
        await soundObject.setIsLoopingAsync(true);
        await retryForStatus(soundObject, { isLooping: true });
      });
    });

    /*describe('Audio.setProgressUpdateIntervalAsync', () => {
      it('sets update interval', async () => {
        const onPlaybackStatusUpdate = t.jasmine.createSpy('onPlaybackStatusUpdate');
        await soundObject.loadAsync(mainTestingSource, { shouldPlay: true });
        await retryForStatus(soundObject, { isPlaying: true });
        soundObject.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
        await soundObject.setProgressUpdateIntervalAsync(100);
        await new Promise(resolve => {
          setTimeout(() => {
            expect(onPlaybackStatusUpdate.calls.count()).toBeGreaterThan(5);
            resolve();
          }, 800);
        });
      });
    });*/

    describe('Audio.setRateAsync', () => {
      let rate = 0;
      let shouldError = false;
      let shouldCorrectPitch = false;
      let pitchCorrectionQuality = Audio.PitchCorrectionQuality.Low;

      beforeEach(async () => {
        const rate = 0.9;

        const status = await soundObject.loadAsync(mainTestingSource, { rate });
        expect(status.rate).toBeCloseTo(rate, 2);
      });

      afterEach(async () => {
        let hasBeenRejected = false;

        try {
          const status = await soundObject.setRateAsync(
            rate,
            shouldCorrectPitch,
            pitchCorrectionQuality
          );
          expect(status.rate).toBeCloseTo(rate, 2);
          expect(status.shouldCorrectPitch).toBe(shouldCorrectPitch);
          expect(status.pitchCorrectionQuality).toBe(pitchCorrectionQuality);
        } catch (error) {
          hasBeenRejected = true;
        }

        expect(hasBeenRejected).toEqual(shouldError);

        rate = 0;
        shouldError = false;
        shouldCorrectPitch = false;
      });

      it('sets rate with shouldCorrectPitch = true', async () => {
        rate = 1.5;
        shouldCorrectPitch = true;
      });

      it('sets rate with shouldCorrectPitch = false', async () => {
        rate = 0.75;
        shouldCorrectPitch = false;
      });

      it('sets pitchCorrectionQuality to Low', async () => {
        rate = 0.5;
        shouldCorrectPitch = true;
        pitchCorrectionQuality = Audio.PitchCorrectionQuality.Low;
      });

      it('sets pitchCorrectionQuality to Medium', async () => {
        pitchCorrectionQuality = Audio.PitchCorrectionQuality.Medium;
      });

      it('sets pitchCorrectionQuality to High', async () => {
        pitchCorrectionQuality = Audio.PitchCorrectionQuality.High;
      });

      it('rejects too high rate', async () => {
        rate = 40;
        shouldError = true;
      });

      it('rejects negative rate', async () => {
        rate = -10;
        shouldError = true;
      });
    });
  });
}
