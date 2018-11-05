'use strict';

import { Platform } from 'react-native';
import { Audio, Permissions } from 'expo';
import { flatten, filter, takeRight, map } from 'lodash';

import * as TestUtils from '../TestUtils';
import { retryForStatus, waitFor } from './helpers';

export const name = 'Recording';

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

export async function test(t) {
  const shouldSkipTestsRequiringPermissions = await TestUtils.shouldSkipTestsRequiringPermissionsAsync();
  const describeWithPermissions = shouldSkipTestsRequiringPermissions ? t.xdescribe : t.describe;

  describeWithPermissions('Recording', () => {
    t.beforeAll(async () => {
      await Audio.setAudioModeAsync({
        shouldDuckAndroid: true,
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
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

    t.beforeEach(async () => {
      const { status } = await Permissions.getAsync(Permissions.AUDIO_RECORDING);
      t.expect(status).toEqual('granted');
      recordingObject = new Audio.Recording();
    });

    t.afterEach(() => {
      recordingObject = null;
    });

    t.describe('Recording.prepareToRecordAsync(preset)', () => {
      t.afterEach(async () => {
        await recordingObject.startAsync();
        await waitFor(defaultRecordingDurationMillis);
        await recordingObject.stopAndUnloadAsync();
      });

      t.it('sets high preset successfully', async () => {
        await recordingObject.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      });

      t.it('sets low preset successfully', async () => {
        await recordingObject.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_LOW_QUALITY);
      });

      t.it('sets custom preset successfully', async () => {
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

    // t.describe('Recording.isPreparedToRecord()', () => {
    //   t.beforeEach(
    //     async () =>
    //       await recordingObject.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_LOW_QUALITY)
    //   );
    //   t.afterEach(async () => await recordingObject.stopAndUnloadAsync());

    //   t.it('returns a boolean', () => {
    //     const returnedValue = recordingObject.isPreparedToRecord();
    //     const valueIsABoolean = returnedValue === false || returnedValue === true;
    //     t.expect(valueIsABoolean).toBe(true);
    //   });
    // });

    t.describe('Recording.setOnRecordingStatusUpdate(onRecordingStatusUpdate)', () => {
      t.it('sets a function that gets called when status updates', async () => {
        const onRecordingStatusUpdate = t.jasmine.createSpy('onRecordingStatusUpdate');
        recordingObject.setOnRecordingStatusUpdate(onRecordingStatusUpdate);
        t
          .expect(onRecordingStatusUpdate)
          .toHaveBeenCalledWith(t.jasmine.objectContaining({ canRecord: false }));
        await recordingObject.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_LOW_QUALITY);
        t
          .expect(onRecordingStatusUpdate)
          .toHaveBeenCalledWith(t.jasmine.objectContaining({ canRecord: true }));
        await recordingObject.startAsync();
        await waitFor(defaultRecordingDurationMillis);
        await recordingObject.stopAndUnloadAsync();
      });

      t.it('sets a function that gets called when recording finishes', async () => {
        const onRecordingStatusUpdate = t.jasmine.createSpy('onRecordingStatusUpdate');
        recordingObject.setOnRecordingStatusUpdate(onRecordingStatusUpdate);
        t
          .expect(onRecordingStatusUpdate)
          .toHaveBeenCalledWith(t.jasmine.objectContaining({ canRecord: false }));
        await recordingObject.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_LOW_QUALITY);
        t
          .expect(onRecordingStatusUpdate)
          .toHaveBeenCalledWith(t.jasmine.objectContaining({ canRecord: true }));
        await recordingObject.startAsync();
        await waitFor(defaultRecordingDurationMillis);
        await recordingObject.stopAndUnloadAsync();
        t
          .expect(onRecordingStatusUpdate)
          .toHaveBeenCalledWith(
            t.jasmine.objectContaining({ isDoneRecording: true, canRecord: false })
          );
      });
    });

    /*t.describe('Recording.setProgressUpdateInterval(millis)', () => {
      t.afterEach(async () => await recordingObject.stopAndUnloadAsync());

      t.it('sets frequence of the progress updates', async () => {
        const onRecordingStatusUpdate = t.jasmine.createSpy('onRecordingStatusUpdate');
        recordingObject.setOnRecordingStatusUpdate(onRecordingStatusUpdate);
        await recordingObject.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_LOW_QUALITY);
        await recordingObject.startAsync();
        const updateInterval = 50;
        recordingObject.setProgressUpdateInterval(updateInterval);
        await new Promise(resolve => {
          setTimeout(() => {
            const expectedArgsCount = Platform.OS === 'android' ? 5 : 10;
            t.expect(onRecordingStatusUpdate.calls.count()).toBeGreaterThan(expectedArgsCount);

            const realMillis = map(
              takeRight(filter(flatten(onRecordingStatusUpdate.calls.allArgs()), 'isRecording'), 4),
              'durationMillis'
            );

            for (let i = 3; i > 0; i--) {
              const difference = Math.abs(realMillis[i] - realMillis[i - 1] - updateInterval);
              t.expect(difference).toBeLessThan(updateInterval / 2 + 1);
            }

            resolve();
          }, 800);
        });
      });
    });*/

    t.describe('Recording.startAsync()', () => {
      t.afterEach(async () => {
        await waitFor(defaultRecordingDurationMillis);
        await recordingObject.stopAndUnloadAsync();
      });

      t.it('starts a clean recording', async () => {
        await recordingObject.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_LOW_QUALITY);
        await recordingObject.startAsync();
        await retryForStatus(recordingObject, { isRecording: true });
      });

      if (pausingIsSupported) {
        t.it('starts a paused recording', async () => {
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
      t.describe('Recording.pauseAsync()', () => {
        t.it('pauses the recording', async () => {
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

    t.describe('Recording.getURI()', () => {
      t.it('returns null before the recording is prepared', async () => {
        t.expect(recordingObject.getURI()).toBeNull();
      });

      t.it('returns a string once the recording is prepared', async () => {
        await recordingObject.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_LOW_QUALITY);
        await recordingObject.startAsync();
        await waitFor(defaultRecordingDurationMillis);
        t.expect(recordingObject.getURI()).toContain('file:///');
        await recordingObject.stopAndUnloadAsync();
      });
    });

    t.describe('Recording.createNewLoadedSound()', () => {
      t.it('fails if called before the recording is prepared', async () => {
        let error = null;
        try {
          await recordingObject.createNewLoadedSound();
        } catch (err) {
          error = err;
        }
        t.expect(error).toBeDefined();
      });

      if (Platform.OS !== 'android') {
        t.it('fails if called before the recording is started', async () => {
          await recordingObject.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_LOW_QUALITY);
          let error = null;
          try {
            await recordingObject.createNewLoadedSound();
          } catch (err) {
            error = err;
          }
          t.expect(error).toBeDefined();
          await recordingObject.stopAndUnloadAsync();
        });
      }

      t.it('fails if called before the recording is recording', async () => {
        await recordingObject.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_LOW_QUALITY);
        await recordingObject.startAsync();
        await waitFor(defaultRecordingDurationMillis);
        let error = null;
        try {
          await recordingObject.createNewLoadedSound();
        } catch (err) {
          error = err;
        }
        t.expect(error).toBeDefined();
        await recordingObject.stopAndUnloadAsync();
      });

      t.it('returns a sound object once the recording is done', async () => {
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
              t.expect(status.durationMillis).toBeGreaterThan(recordingDuration * (7 / 10));
              t.expect(sound).toBeDefined();
            } catch (err) {
              error = err;
            }
            t.expect(error).toBeNull();

            resolve();
          }, recordingDuration);
        });
      });

      if (Platform.OS === 'android') {
        t.it('raises an error when the recording is in an unreadable format', async () => {
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
              t.expect(error).toBeDefined();

              resolve();
            }, recordingDuration);
          });
        });
      }
    });
  });
}
