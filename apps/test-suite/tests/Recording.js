'use strict';

import { Platform } from 'react-native';
import * as Permissions from 'expo-permissions';
import { Audio } from 'expo-av';

import * as TestUtils from '../TestUtils';
import { retryForStatus, waitFor } from './helpers';

export const name = 'Recording';

export function canRunAsync({ isAutomated, isDevice }) {
  return !isAutomated;
}

const defaultRecordingDurationMillis = 500;

const amrSettings = {
  android: {
    extension: '.amr',
    outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_AMR_NB,
    audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AMR_NB,
    sampleRate: 8000,
    numberOfChannels: 1,
    bitRate: 128000,
  },
  ios: {
    extension: '.amr',
    outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_AMR,
    audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
    sampleRate: 8000,
    numberOfChannels: 1,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
};

// In some tests one can see:
//
// ```
// await recordingObject.startAsync();
// await waitFor(defaultRecordingDurationMillis);
// await recordingObject.stopAndUnloadAsync();
// ```
//
// iOS doesn't need starting to be able to `stopAndUnload`, however
// Android throws an exception, as intended by the authors:
// > Note that a RuntimeException is intentionally thrown to the application,
// > if no valid audio/video data has been received when stop() is called.
// > This happens if stop() is called immediately after start().
// > Source: https://developer.android.com/reference/android/media/MediaRecorder.html#stop()

export async function test({
  beforeAll,
  describe,
  it,
  xit,
  xdescribe,
  beforeEach,
  jasmine,
  expect,
  ...t
}) {
  const shouldSkipTestsRequiringPermissions = await TestUtils.shouldSkipTestsRequiringPermissionsAsync();
  const describeWithPermissions = shouldSkipTestsRequiringPermissions ? t.xdescribe : describe;

  describeWithPermissions('Recording', () => {
    t.beforeAll(async () => {
      await Audio.setAudioModeAsync({
        shouldDuckAndroid: true,
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        playThroughEarpieceAndroid: false,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_MIX_WITH_OTHERS,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS,
      });

      await TestUtils.acceptPermissionsAndRunCommandAsync(() => {
        return Permissions.askAsync(Permissions.AUDIO_RECORDING);
      });
    });

    // According to the documentation pausing should be supported on Android API >= 24,
    // unfortunately such test fails on Android v24.
    const pausingIsSupported = Platform.OS !== 'android' || Platform.Version >= 25;
    let recordingObject = null;

    beforeEach(async () => {
      const { status } = await Permissions.getAsync(Permissions.AUDIO_RECORDING);
      expect(status).toEqual('granted');
      recordingObject = new Audio.Recording();
    });

    afterEach(() => {
      recordingObject = null;
    });

    describe('Recording.prepareToRecordAsync(preset)', () => {
      afterEach(async () => {
        await recordingObject.startAsync();
        await waitFor(defaultRecordingDurationMillis);
        await recordingObject.stopAndUnloadAsync();
      });

      it('sets high preset successfully', async () => {
        await recordingObject.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      });

      it('sets low preset successfully', async () => {
        await recordingObject.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_LOW_QUALITY);
      });

      it('sets custom preset successfully', async () => {
        const commonOptions = {
          bitRate: 8000,
          sampleRate: 8000,
          numberOfChannels: 1,
        };
        await recordingObject.prepareToRecordAsync({
          android: {
            extension: '.aac',
            audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
            outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_AAC_ADIF,
            ...commonOptions,
          },
          ios: {
            extension: '.ulaw',
            linearPCMBitDepth: 8,
            linearPCMIsFloat: false,
            linearPCMIsBigEndian: false,
            outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_ULAW,
            audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_MEDIUM,
            ...commonOptions,
          },
        });
      });
    });

    // Such function exists in the documentation, but not in the implementation.

    // describe('Recording.isPreparedToRecord()', () => {
    //   t.beforeEach(
    //     async () =>
    //       await recordingObject.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_LOW_QUALITY)
    //   );
    //   afterEach(async () => await recordingObject.stopAndUnloadAsync());

    //   it('returns a boolean', () => {
    //     const returnedValue = recordingObject.isPreparedToRecord();
    //     const valueIsABoolean = returnedValue === false || returnedValue === true;
    //     expect(valueIsABoolean).toBe(true);
    //   });
    // });

    describe('Recording.setOnRecordingStatusUpdate(onRecordingStatusUpdate)', () => {
      it('sets a function that gets called when status updates', async () => {
        const onRecordingStatusUpdate = jasmine.createSpy('onRecordingStatusUpdate');
        recordingObject.setOnRecordingStatusUpdate(onRecordingStatusUpdate);
        expect(onRecordingStatusUpdate).toHaveBeenCalledWith(
          jasmine.objectContaining({ canRecord: false })
        );
        await recordingObject.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_LOW_QUALITY);
        expect(onRecordingStatusUpdate).toHaveBeenCalledWith(
          jasmine.objectContaining({ canRecord: true })
        );
        await recordingObject.startAsync();
        await waitFor(defaultRecordingDurationMillis);
        await recordingObject.stopAndUnloadAsync();
      });

      it('sets a function that gets called when recording finishes', async () => {
        const onRecordingStatusUpdate = jasmine.createSpy('onRecordingStatusUpdate');
        recordingObject.setOnRecordingStatusUpdate(onRecordingStatusUpdate);
        expect(onRecordingStatusUpdate).toHaveBeenCalledWith(
          jasmine.objectContaining({ canRecord: false })
        );
        await recordingObject.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_LOW_QUALITY);
        expect(onRecordingStatusUpdate).toHaveBeenCalledWith(
          jasmine.objectContaining({ canRecord: true })
        );
        await recordingObject.startAsync();
        await waitFor(defaultRecordingDurationMillis);
        await recordingObject.stopAndUnloadAsync();
        expect(onRecordingStatusUpdate).toHaveBeenCalledWith(
          jasmine.objectContaining({ isDoneRecording: true, canRecord: false })
        );
      });
    });

    /*describe('Recording.setProgressUpdateInterval(millis)', () => {
      afterEach(async () => await recordingObject.stopAndUnloadAsync());

      it('sets frequence of the progress updates', async () => {
        const onRecordingStatusUpdate = jasmine.createSpy('onRecordingStatusUpdate');
        recordingObject.setOnRecordingStatusUpdate(onRecordingStatusUpdate);
        await recordingObject.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_LOW_QUALITY);
        await recordingObject.startAsync();
        const updateInterval = 50;
        recordingObject.setProgressUpdateInterval(updateInterval);
        await new Promise(resolve => {
          setTimeout(() => {
            const expectedArgsCount = Platform.OS === 'android' ? 5 : 10;
            expect(onRecordingStatusUpdate.calls.count()).toBeGreaterThan(expectedArgsCount);

            const realMillis = map(
              takeRight(filter(flatten(onRecordingStatusUpdate.calls.allArgs()), 'isRecording'), 4),
              'durationMillis'
            );

            for (let i = 3; i > 0; i--) {
              const difference = Math.abs(realMillis[i] - realMillis[i - 1] - updateInterval);
              expect(difference).toBeLessThan(updateInterval / 2 + 1);
            }

            resolve();
          }, 800);
        });
      });
    });*/

    describe('Recording.startAsync()', () => {
      afterEach(async () => {
        await waitFor(defaultRecordingDurationMillis);
        await recordingObject.stopAndUnloadAsync();
      });

      it('starts a clean recording', async () => {
        await recordingObject.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_LOW_QUALITY);
        await recordingObject.startAsync();
        await retryForStatus(recordingObject, { isRecording: true });
      });

      if (pausingIsSupported) {
        it('starts a paused recording', async () => {
          await recordingObject.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_LOW_QUALITY);
          await recordingObject.startAsync();
          await retryForStatus(recordingObject, { isRecording: true });
          await recordingObject.pauseAsync();
          await retryForStatus(recordingObject, { isRecording: false });
          await recordingObject.startAsync();
          await retryForStatus(recordingObject, { isRecording: true });
        });
      }
    });

    if (pausingIsSupported) {
      describe('Recording.pauseAsync()', () => {
        it('pauses the recording', async () => {
          await recordingObject.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_LOW_QUALITY);
          await recordingObject.startAsync();
          await retryForStatus(recordingObject, { isRecording: true });
          await waitFor(defaultRecordingDurationMillis);
          await recordingObject.pauseAsync();
          await retryForStatus(recordingObject, { isRecording: false });
          await recordingObject.stopAndUnloadAsync();
        });
      });
    }

    describe('Recording.getURI()', () => {
      it('returns null before the recording is prepared', async () => {
        expect(recordingObject.getURI()).toBeNull();
      });

      it('returns a string once the recording is prepared', async () => {
        await recordingObject.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_LOW_QUALITY);
        await recordingObject.startAsync();
        await waitFor(defaultRecordingDurationMillis);
        expect(recordingObject.getURI()).toContain('file:///');
        await recordingObject.stopAndUnloadAsync();
      });
    });

    describe('Recording.createNewLoadedSound()', () => {
      let originalConsoleWarn;

      beforeAll(() => {
        originalConsoleWarn = console.warn;
        console.warn = (...args) => {
          if (typeof args[0] === 'string' && args[0].indexOf('deprecated') > -1) {
            return;
          }
          originalConsoleWarn(...args);
        };
      });

      afterAll(() => {
        console.warn = originalConsoleWarn;
        originalConsoleWarn = null;
      });

      it('fails if called before the recording is prepared', async () => {
        let error = null;
        try {
          await recordingObject.createNewLoadedSound();
        } catch (err) {
          error = err;
        }
        expect(error).toBeDefined();
      });

      if (Platform.OS !== 'android') {
        it('fails if called before the recording is started', async () => {
          await recordingObject.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_LOW_QUALITY);
          let error = null;
          try {
            await recordingObject.createNewLoadedSound();
          } catch (err) {
            error = err;
          }
          expect(error).toBeDefined();
          await recordingObject.stopAndUnloadAsync();
        });
      }

      it('fails if called before the recording is recording', async () => {
        await recordingObject.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_LOW_QUALITY);
        await recordingObject.startAsync();
        await waitFor(defaultRecordingDurationMillis);
        let error = null;
        try {
          await recordingObject.createNewLoadedSound();
        } catch (err) {
          error = err;
        }
        expect(error).toBeDefined();
        await recordingObject.stopAndUnloadAsync();
      });

      it('returns a sound object once the recording is done', async () => {
        await recordingObject.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_LOW_QUALITY);
        await recordingObject.startAsync();

        const recordingDuration = defaultRecordingDurationMillis;
        await new Promise(resolve => {
          setTimeout(async () => {
            await recordingObject.stopAndUnloadAsync();
            let error = null;
            try {
              const { sound } = await recordingObject.createNewLoadedSound();
              await retryForStatus(sound, { isBuffering: false });
              const status = await sound.getStatusAsync();
              // Android is slow and we have to take it into account when checking recording duration.
              expect(status.durationMillis).toBeGreaterThan(recordingDuration * (7 / 10));
              expect(sound).toBeDefined();
            } catch (err) {
              error = err;
            }
            expect(error).toBeNull();

            resolve();
          }, recordingDuration);
        });
      });

      if (Platform.OS === 'android') {
        it('raises an error when the recording is in an unreadable format', async () => {
          await recordingObject.prepareToRecordAsync(amrSettings);
          await recordingObject.startAsync();

          const recordingDuration = defaultRecordingDurationMillis;
          await new Promise(resolve => {
            setTimeout(async () => {
              await recordingObject.stopAndUnloadAsync();
              let error = null;
              try {
                await recordingObject.createNewLoadedSound();
              } catch (err) {
                error = err;
              }
              expect(error).toBeDefined();

              resolve();
            }, recordingDuration);
          });
        });
      }
    });

    describe('Recording.createNewLoadedSoundAsync()', () => {
      it('fails if called before the recording is prepared', async () => {
        let error = null;
        try {
          await recordingObject.createNewLoadedSoundAsync();
        } catch (err) {
          error = err;
        }
        expect(error).toBeDefined();
      });

      if (Platform.OS !== 'android') {
        it('fails if called before the recording is started', async () => {
          await recordingObject.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_LOW_QUALITY);
          let error = null;
          try {
            await recordingObject.createNewLoadedSoundAsync();
          } catch (err) {
            error = err;
          }
          expect(error).toBeDefined();
          await recordingObject.stopAndUnloadAsync();
        });
      }

      it('fails if called before the recording is recording', async () => {
        await recordingObject.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_LOW_QUALITY);
        await recordingObject.startAsync();
        await waitFor(defaultRecordingDurationMillis);
        let error = null;
        try {
          await recordingObject.createNewLoadedSoundAsync();
        } catch (err) {
          error = err;
        }
        expect(error).toBeDefined();
        await recordingObject.stopAndUnloadAsync();
      });

      it('returns a sound object once the recording is done', async () => {
        await recordingObject.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_LOW_QUALITY);
        await recordingObject.startAsync();

        const recordingDuration = defaultRecordingDurationMillis;
        await new Promise(resolve => {
          setTimeout(async () => {
            await recordingObject.stopAndUnloadAsync();
            let error = null;
            try {
              const { sound } = await recordingObject.createNewLoadedSoundAsync();
              await retryForStatus(sound, { isBuffering: false });
              const status = await sound.getStatusAsync();
              // Android is slow and we have to take it into account when checking recording duration.
              expect(status.durationMillis).toBeGreaterThan(recordingDuration * (7 / 10));
              expect(sound).toBeDefined();
            } catch (err) {
              error = err;
            }
            expect(error).toBeNull();

            resolve();
          }, recordingDuration);
        });
      });

      if (Platform.OS === 'android') {
        it('raises an error when the recording is in an unreadable format', async () => {
          await recordingObject.prepareToRecordAsync(amrSettings);
          await recordingObject.startAsync();

          const recordingDuration = defaultRecordingDurationMillis;
          await new Promise(resolve => {
            setTimeout(async () => {
              await recordingObject.stopAndUnloadAsync();
              let error = null;
              try {
                await recordingObject.createNewLoadedSoundAsync();
              } catch (err) {
                error = err;
              }
              expect(error).toBeDefined();

              resolve();
            }, recordingDuration);
          });
        });
      }
    });
  });
}
