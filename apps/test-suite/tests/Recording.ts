import asyncRetry from 'async-retry';
import {
  setAudioModeAsync,
  requestRecordingPermissionsAsync,
  getRecordingPermissionsAsync,
  RecordingPresets,
  AudioModule,
  RecorderState,
  AudioRecorder,
  AudioQuality,
  IOSOutputFormat,
} from 'expo-audio';
import { isMatch } from 'lodash';
import { Platform } from 'react-native';

import { waitFor } from './helpers';
import * as TestUtils from '../TestUtils';

export const name = 'Recording';

const defaultRecordingDurationMillis = 500;

const retryForStatus = (recorder: AudioRecorder, status: Partial<RecorderState>) =>
  asyncRetry(
    async (bail, retriesCount) => {
      if (!recorder) {
        bail(new Error('Recorder is null or undefined'));
        return;
      }

      const readStatus = recorder.getStatus();
      if (isMatch(readStatus, status)) {
        return true;
      } else {
        const stringifiedStatus = JSON.stringify(status);
        const desiredError = `The recorder has not entered desired state (${stringifiedStatus}) after ${retriesCount} retries.`;
        const lastKnownError = `Last known state: ${JSON.stringify(readStatus)}.`;
        throw new Error(`${desiredError} ${lastKnownError}`);
      }
    },
    { retries: 5, minTimeout: 100 }
  );

export async function test(t) {
  const shouldSkipTestsRequiringPermissions =
    await TestUtils.shouldSkipTestsRequiringPermissionsAsync();
  const describeWithPermissions = shouldSkipTestsRequiringPermissions ? t.xdescribe : t.describe;

  describeWithPermissions('Recorder', () => {
    t.beforeAll(async () => {
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
        interruptionMode: 'mixWithOthers',
        interruptionModeAndroid: 'duckOthers',
        shouldPlayInBackground: true,
        shouldRouteThroughEarpiece: false,
      });

      await TestUtils.acceptPermissionsAndRunCommandAsync(() => {
        return requestRecordingPermissionsAsync();
      });
    });

    // According to the documentation pausing should be supported on Android API >= 24,
    // unfortunately such test fails on Android v24.
    const pausingIsSupported = Platform.OS !== 'android' || Platform.Version >= 25;
    let recorder: AudioRecorder | null = null;

    t.beforeEach(async () => {
      const { status } = await getRecordingPermissionsAsync();
      t.expect(status).toEqual('granted');
      recorder = new AudioModule.AudioRecorder({});
    });

    t.afterEach(() => {
      recorder = null;
    });

    t.describe('Recorder.prepareToRecordAsync(preset)', () => {
      t.afterEach(async () => {
        recorder.record();
        await waitFor(defaultRecordingDurationMillis);
        await recorder.stop();
      });

      t.it('sets high preset successfully', async () => {
        await recorder.prepareToRecordAsync(RecordingPresets.HIGH_QUALITY);
      });

      t.it('sets low preset successfully', async () => {
        await recorder.prepareToRecordAsync(RecordingPresets.LOW_QUALITY);
      });

      t.it('sets custom preset successfully', async () => {
        await recorder.prepareToRecordAsync({
          extension: '.aac',
          bitRate: 64000,
          sampleRate: 44100,
          numberOfChannels: 1,
          android: {
            outputFormat: 'mpeg4',
            audioEncoder: 'aac',
          },
          ios: {
            audioQuality: AudioQuality.HIGH,
            outputFormat: IOSOutputFormat.MPEG4AAC,
            linearPCMBitDepth: 8,
            linearPCMIsFloat: false,
            linearPCMIsBigEndian: false,
          },
        });
      });
    });

    t.describe('Recorder status', () => {
      t.it('has correct status when unprepared', async () => {
        const status = recorder.getStatus();
        t.expect(status.canRecord).toBe(false);
        t.expect(status.isRecording).toBe(false);
      });

      t.it('has correct status when prepared', async () => {
        await recorder.prepareToRecordAsync(RecordingPresets.LOW_QUALITY);
        const status = recorder.getStatus();
        t.expect(status.canRecord).toBe(true);
        t.expect(status.isRecording).toBe(false);
        recorder.record();
        await waitFor(defaultRecordingDurationMillis);
        await recorder.stop();
      });
    });

    t.describe('Recorder.getAvailableInputs()', () => {
      t.afterEach(async () => {
        recorder.record();
        await waitFor(defaultRecordingDurationMillis);
        await recorder.stop();
      });

      t.it('returns a list of available recording inputs', async () => {
        await recorder.prepareToRecordAsync(RecordingPresets.LOW_QUALITY);

        const inputs = await recorder.getAvailableInputs();
        t.expect(inputs.length).toBeGreaterThan(0);
      });
    });

    t.describe('Recorder.getCurrentInput()', () => {
      t.afterEach(async () => {
        recorder.record();
        await waitFor(defaultRecordingDurationMillis);
        await recorder.stop();
      });
      t.it('returns the currently-selected recording input', async () => {
        await recorder.prepareToRecordAsync(RecordingPresets.LOW_QUALITY);

        const input = await recorder.getCurrentInput();
        t.expect(input).toBeDefined();
      });
    });

    t.describe('Recorder.setInput()', () => {
      t.afterEach(async () => {
        recorder.record();
        await waitFor(defaultRecordingDurationMillis);
        await recorder.stop();
      });
      t.it('sets the recording input', async () => {
        await recorder.prepareToRecordAsync(RecordingPresets.LOW_QUALITY);

        const inputs = recorder.getAvailableInputs();
        const initialInput = inputs[0];
        recorder.setInput(initialInput.uid);
        const currentInput = await recorder.getCurrentInput();
        t.expect(currentInput.uid).toEqual(initialInput.uid);
      });
    });

    t.describe('Recorder.record()', () => {
      t.afterEach(async () => {
        await waitFor(defaultRecordingDurationMillis);
        await recorder.stop();
      });

      t.it('starts a clean recording', async () => {
        await recorder.prepareToRecordAsync(RecordingPresets.LOW_QUALITY);
        recorder.record();
        await retryForStatus(recorder, { isRecording: true });
      });

      if (pausingIsSupported) {
        t.it('starts a paused recording', async () => {
          await recorder.prepareToRecordAsync(RecordingPresets.LOW_QUALITY);
          recorder.record();
          await retryForStatus(recorder, { isRecording: true });
          recorder.pause();
          await retryForStatus(recorder, { isRecording: false });
          recorder.record();
          await retryForStatus(recorder, { isRecording: true });
        });
      }
    });

    if (pausingIsSupported) {
      t.describe('Recorder.pause()', () => {
        t.it('pauses the recording', async () => {
          await recorder.prepareToRecordAsync(RecordingPresets.LOW_QUALITY);
          recorder.record();
          await retryForStatus(recorder, { isRecording: true });
          await waitFor(defaultRecordingDurationMillis);
          recorder.pause();
          await retryForStatus(recorder, { isRecording: false });
          await recorder.stop();
        });
      });
    }

    t.describe('Recorder.uri', () => {
      t.it('returns correct initial URI value based on platform', async () => {
        if (Platform.OS === 'ios') {
          t.expect(recorder.uri).toContain('file:///');
        } else {
          t.expect(recorder.uri).toBeFalsy();
        }
      });

      t.it('returns a string once the recording is prepared', async () => {
        await recorder.prepareToRecordAsync(RecordingPresets.LOW_QUALITY);
        recorder.record();
        await waitFor(defaultRecordingDurationMillis);
        if (Platform.OS === 'web') {
          // On web, URI is not available until completion
          t.expect(recorder.uri).toBeFalsy();
        } else {
          t.expect(recorder.uri).toContain('file:///');
        }
        await recorder.stop();
      });
    });
  });
}
