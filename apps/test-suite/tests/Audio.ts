import asyncRetry from 'async-retry';
import { Asset } from 'expo-asset';
import {
  setAudioModeAsync,
  setIsAudioActiveAsync,
  createAudioPlayer,
  AudioMode,
  AudioPlayer,
  AudioStatus,
  PitchCorrectionQuality,
} from 'expo-audio';
import { isMatch } from 'lodash';
import { Platform } from 'react-native';

export const name = 'Audio';

const mainTestingSource = require('../assets/LLizard.mp3');
const soundUri = 'https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3';
const hlsStreamUri =
  'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8';
const authenticatedStaticFilesBackend = 'https://authenticated-static-files.vercel.app';

const retryForStatus = (player: AudioPlayer, status: Partial<AudioStatus>) =>
  asyncRetry(
    async (bail, retriesCount) => {
      if (!player) {
        bail(new Error('Player is null or undefined'));
        return;
      }

      const readStatus = player.currentStatus;
      if (isMatch(readStatus, status)) {
        return true;
      } else {
        const stringifiedStatus = JSON.stringify(status);
        const desiredError = `The player instance has not entered desired state (${stringifiedStatus}) after ${retriesCount} retries.`;
        const lastKnownError = `Last known state: ${JSON.stringify(readStatus)}.`;
        throw new Error(`${desiredError} ${lastKnownError}`);
      }
    },
    { retries: 5, minTimeout: 100 }
  );

export function test({ describe, expect, it, ...t }: any) {
  describe('Audio Module', () => {
    describe('setAudioModeAsync', () => {
      if (Platform.OS === 'ios') {
        it('rejects an invalid promise', async () => {
          const mode: AudioMode = {
            playsInSilentMode: false,
            allowsRecording: true,
            interruptionMode: 'doNotMix',
            interruptionModeAndroid: 'doNotMix',
            shouldPlayInBackground: false,
            shouldRouteThroughEarpiece: false,
          };
          let error: Error | null = null;
          try {
            await setAudioModeAsync(mode);
          } catch (err: any) {
            error = err;
          }
          expect(error).not.toBeNull();
          error && expect(error.message).toMatch('Impossible audio mode');
        });
      }
    });
  });

  describe('Player instance', () => {
    let player: AudioPlayer = null;

    t.beforeAll(async () => {
      await setIsAudioActiveAsync(true);
    });

    t.afterEach(async () => {
      if (player) {
        try {
          player.release();
        } catch (error: any) {
          console.warn('Player release error:', error.message);
        }
        player = null;
      }
    });

    describe('createAudioPlayer', () => {
      it('loads the file with `require`', async () => {
        player = createAudioPlayer(require('../assets/LLizard.mp3'));
        await retryForStatus(player, { isLoaded: true });
      });

      it('loads the file from `Asset`', async () => {
        player = createAudioPlayer(Asset.fromModule(require('../assets/LLizard.mp3')));
        await retryForStatus(player, { isLoaded: true });
      });

      it('loads the file from the Internet', async () => {
        player = createAudioPlayer({ uri: soundUri });
        await retryForStatus(player, { isLoaded: true });
      });

      it('supports adding custom headers to media request', async () => {
        let error: Error | null = null;
        try {
          player = createAudioPlayer({
            uri: `${authenticatedStaticFilesBackend}/LLizard.mp3`,
          });
          await retryForStatus(player, { isLoaded: true });
        } catch (err: any) {
          error = err;
        }
        expect(error).not.toBeNull();

        error = null;
        try {
          player = createAudioPlayer({
            uri: `${authenticatedStaticFilesBackend}/LLizard.mp3`,
            headers: {
              authorization: 'mellon',
            },
          });
          await retryForStatus(player, { isLoaded: true });
        } catch (err: any) {
          error = err;
        }
        expect(error).toBeNull();
      }, 30000);

      it('loads HLS stream', async () => {
        player = createAudioPlayer({
          uri: hlsStreamUri,
        });
        await retryForStatus(player, { isLoaded: true });
      });
    });

    describe('Player.replace()', () => {
      it('replaces the audio source', async () => {
        player = createAudioPlayer(mainTestingSource);
        await retryForStatus(player, { isLoaded: true });

        player.replace({ uri: soundUri });
        await retryForStatus(player, { isLoaded: true });
      });
    });

    describe('Player.play()', () => {
      it('plays the sound', async () => {
        player = createAudioPlayer(mainTestingSource);
        await retryForStatus(player, { isLoaded: true });
        player.play();
        await retryForStatus(player, { playing: true });
      });
    });

    describe('Player.pause()', () => {
      it('pauses the sound', async () => {
        player = createAudioPlayer(mainTestingSource);
        await retryForStatus(player, { isLoaded: true });
        player.play();
        await retryForStatus(player, { playing: true });
        player.pause();
        await retryForStatus(player, { playing: false });
        player.play();
        await retryForStatus(player, { playing: true });
      });
    });

    describe('Player.seekTo()', () => {
      it('sets the position', async () => {
        player = createAudioPlayer(mainTestingSource);
        await retryForStatus(player, { isLoaded: true });
        await player.seekTo(1);
        await retryForStatus(player, { currentTime: 1 });
      });
    });

    describe('Player.volume', () => {
      t.beforeEach(async () => {
        player = createAudioPlayer(mainTestingSource);
        await retryForStatus(player, { isLoaded: true });
        player.volume = 1;
      });

      it('sets the volume', async () => {
        player.volume = 0.5;
        expect(player.volume).toBeCloseTo(0.5, 2);
      });
    });

    describe('Player.mute', () => {
      it('sets whether the audio is muted', async () => {
        player = createAudioPlayer(mainTestingSource);
        await retryForStatus(player, { isLoaded: true });
        player.muted = true;
        await retryForStatus(player, { mute: true });
        player.muted = false;
        await retryForStatus(player, { mute: false });
      });
    });

    describe('Player.loop', () => {
      it('sets whether the audio is looped', async () => {
        player = createAudioPlayer(mainTestingSource);
        await retryForStatus(player, { isLoaded: true });
        player.loop = false;
        await retryForStatus(player, { loop: false });
        player.loop = true;
        await retryForStatus(player, { loop: true });
      });
    });

    describe('Player.setPlaybackRate()', () => {
      let rate = 0;
      let pitchCorrectionQuality: PitchCorrectionQuality = 'low';

      t.beforeEach(async () => {
        const testRate = 0.9;

        player = createAudioPlayer(mainTestingSource);
        await retryForStatus(player, { isLoaded: true });

        player.setPlaybackRate(testRate, 'medium');

        const status = player.currentStatus;
        expect(status.playbackRate).toBeCloseTo(testRate, 2);
      });

      t.afterEach(async () => {
        player.setPlaybackRate(rate, pitchCorrectionQuality);

        const status = player.currentStatus;
        expect(status.playbackRate).toBeCloseTo(rate, 2);
        expect(status.shouldCorrectPitch).toBe(player.shouldCorrectPitch);

        rate = 0;
        player.shouldCorrectPitch = false;
      });

      it('sets rate with shouldCorrectPitch = true', async () => {
        rate = 1.5;
        player.shouldCorrectPitch = true;
      });

      it('sets rate with shouldCorrectPitch = false', async () => {
        rate = 0.75;
        player.shouldCorrectPitch = false;
      });

      if (Platform.OS === 'ios') {
        it('sets pitchCorrectionQuality to Low', async () => {
          rate = 0.5;
          player.shouldCorrectPitch = true;
          pitchCorrectionQuality = 'low';
        });

        it('sets pitchCorrectionQuality to Medium', async () => {
          pitchCorrectionQuality = 'medium';
        });

        it('sets pitchCorrectionQuality to High', async () => {
          pitchCorrectionQuality = 'high';
        });
      }
    });

    describe('Player properties', () => {
      t.beforeEach(async () => {
        player = createAudioPlayer(mainTestingSource);
        await retryForStatus(player, { isLoaded: true });
      });

      it('has correct default values', async () => {
        expect(player.isLoaded).toBe(true);
        expect(player.playing).toBe(false);
        expect(player.paused).toBe(true);
        expect(player.muted).toBe(false);
        expect(player.loop).toBe(false);
        expect(player.shouldCorrectPitch).toBe(false);
        expect(player.currentTime).toBe(0);
        expect(player.duration).toBeGreaterThan(0);
      });

      it('has valid currentStatus object', async () => {
        const status = player.currentStatus;
        expect(status).toBeDefined();
        expect(status.isLoaded).toBe(true);
        expect(status.playing).toBe(false);
        expect(status.mute).toBe(false);
        expect(status.loop).toBe(false);
        expect(status.didJustFinish).toBe(false);
      });
    });

    it('handles volume bounds correctly', async () => {
      player = createAudioPlayer(mainTestingSource);
      await retryForStatus(player, { isLoaded: true });

      if (Platform.OS === 'android') {
        // Android clamps volume to [0, 1]
        player.volume = 2;
        expect(player.volume).toBeLessThanOrEqual(1);

        player.volume = -1;
        expect(player.volume).toBeGreaterThanOrEqual(0);
      } else {
        player.volume = 2;
        expect(typeof player.volume).toBe('number');
      }

      player.volume = 0.5;
      expect(player.volume).toBeCloseTo(0.5, 2);
    });

    it('handles playback rate bounds correctly', async () => {
      player = createAudioPlayer(mainTestingSource);
      await retryForStatus(player, { isLoaded: true });

      player.setPlaybackRate(0.5, 'medium');
      expect(player.playbackRate).toBeCloseTo(0.5, 2);

      player.setPlaybackRate(1.5, 'high');
      expect(player.playbackRate).toBeCloseTo(1.5, 2);

      player.setPlaybackRate(-1);
      expect(player.playbackRate).toBeGreaterThanOrEqual(0);

      player.setPlaybackRate(5.0);
      expect(player.playbackRate).toBeLessThanOrEqual(2.0);
    });

    it('handles seeking correctly', async () => {
      player = createAudioPlayer(mainTestingSource);
      await retryForStatus(player, { isLoaded: true });

      const duration = player.duration;

      await player.seekTo(duration / 2);
      expect(player.currentTime).toBeGreaterThan(0);
      expect(player.currentTime).toBeLessThan(duration);

      await player.seekTo(0);
      expect(player.currentTime).toBeCloseTo(0, 1);
    });

    describe('Player state', () => {
      it('maintains consistent playing/paused state', async () => {
        player = createAudioPlayer(mainTestingSource);
        await retryForStatus(player, { isLoaded: true });

        expect(player.playing).toBe(false);
        expect(player.paused).toBe(true);

        player.play();
        await retryForStatus(player, { playing: true });
        expect(player.playing).toBe(true);
        expect(player.paused).toBe(false);

        player.pause();
        await retryForStatus(player, { playing: false });
        expect(player.playing).toBe(false);
        expect(player.paused).toBe(true);
      });
    });
  });
}
