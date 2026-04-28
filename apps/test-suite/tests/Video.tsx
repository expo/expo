'use strict';

import { EventSubscription } from 'expo-modules-core';
import {
  createVideoPlayer,
  SourceLoadEventPayload,
  SubtitleTrack,
  TimeUpdateEventPayload,
  VideoPlayer,
  VideoPlayerEvents,
  VideoPlayerStatus,
  VideoSource,
  VideoSourceObject,
  VideoView,
} from 'expo-video';
import React from 'react';

import { mountAndWaitFor } from './helpers';

export const name = 'Video';

const localVideoId: VideoSource = require('../assets/big_buck_bunny.mp4') as number;

const localVideoSource = {
  assetId: localVideoId,
  metadata: {
    title: 'Local Big Buck Bunny',
    artist: 'Blender Foundation',
    artwork: 'https://m.media-amazon.com/images/I/519Hct2QoeL.jpg',
  },
};

const bigBuckBunnySource = {
  uri: 'https://expo-test-media.com/big_buck_bunny/bbb_720p.mp4',
  metadata: {
    title: 'Big Buck Bunny',
    artist: 'The Open Movie Project',
    artwork: 'https://expo-test-media.com/big_buck_bunny/artwork.jpg',
  },
};

const elephantsDreamSource = {
  uri: 'https://expo-test-media.com/elephants_dream/ed_720p.mp4',
  metadata: {
    title: 'Elephants Dream',
    artist: 'Blender Foundation',
    artwork: 'https://expo-test-media.com/elephants_dream/artwork.jpg',
  },
};

export const hlsSource = {
  uri: 'https://expo-test-media.com/tos_hls/master.m3u8',
  metadata: {
    title: 'Sintel',
    artist: 'Blender Foundation',
    artwork: 'https://expo-test-media.com/tos_hls/artwork.jpg',
  },
};

export const nullSource = {
  metadata: {
    title: 'Null Source',
    artist: '-',
  },
};

const brokenSource = {
  uri: 'https://i.am.a.broken.link.wow.mp4',
  metadata: {
    title: 'Broken source',
    artist: '-',
  },
};

// START: Expected return values from SourceLoadEventPayload
const bigBuckBunnySourceData: SourceLoadEventPayload = {
  availableVideoTracks: [
    {
      bitrate: 1676863,
      id: '2',
      isSupported: true,
      frameRate: 30,
      peakBitrate: 1676863,
      mimeType: 'video/avc',
      size: { height: 720, width: 1280 },
      averageBitrate: 1676863,
    },
  ],
  videoSource: {
    uri: 'https://expo-test-media.com/big_buck_bunny/bbb_720p.mp4',
    metadata: {
      artist: 'The Open Movie Project',
      title: 'Big Buck Bunny',
      artwork: 'https://expo-test-media.com/big_buck_bunny/artwork.jpg',
    },
    drm: null,
    headers: null,
    useCaching: false,
    contentType: 'auto',
  },
  availableAudioTracks: [],
  availableSubtitleTracks: [],
  duration: 634.533333,
};

const localVideoSourceData: SourceLoadEventPayload = {
  videoSource: {
    headers: null,
    contentType: 'auto',
    drm: null,
    uri: 'http://192.168.93.59:8081/assets/?unstable_path=.%2F..%2Ftest-suite%2Fassets/big_buck_bunny.mp4?platform=ios&hash=708733b3eb889d0a85427b938591c6b1',
    useCaching: false,
    metadata: { artwork: null, artist: 'Blender Foundation', title: 'Local Big Buck Bunny' },
  },
  availableSubtitleTracks: [],
  availableAudioTracks: [{ language: 'und', label: 'Unknown language' }],
  availableVideoTracks: [
    {
      mimeType: 'video/mp4v',
      isSupported: true,
      size: { width: 569, height: 320 },
      averageBitrate: 240787,
      id: '1',
      bitrate: 240787,
      peakBitrate: null,
      frameRate: 24,
    },
  ],
  duration: 15,
};

const hlsSourceData: SourceLoadEventPayload = {
  videoSource: {
    uri: 'https://expo-test-media.com/tos_hls/master.m3u8',
    drm: null,
    contentType: 'auto',
    metadata: {
      title: 'Sintel',
      artist: 'Blender Foundation',
      artwork: 'https://expo-test-media.com/tos_hls/artwork.jpg',
    },
    headers: null,
    useCaching: false,
  },
  duration: 734.167,
  availableSubtitleTracks: [
    { language: 'en', label: 'English' },
    { language: 'de', label: 'German' },
    { language: 'es', label: 'Spanish' },
    { language: 'fr', label: 'French' },
  ],
  availableVideoTracks: [
    {
      peakBitrate: 7628000,
      size: { height: 800, width: 1920 },
      bitrate: 7628000,
      averageBitrate: null,
      isSupported: true,
      id: 'video/original/playlist.m3u8',
      mimeType: 'video/avc',
      frameRate: null,
    },
    {
      peakBitrate: 2128000,
      size: { height: 800, width: 1920 },
      bitrate: 2128000,
      averageBitrate: null,
      isSupported: true,
      id: 'video/1080p/playlist.m3u8',
      mimeType: 'video/avc',
      frameRate: null,
    },
    {
      peakBitrate: 1628000,
      size: { height: 534, width: 1280 },
      bitrate: 1628000,
      averageBitrate: null,
      isSupported: true,
      id: 'video/720p/playlist.m3u8',
      mimeType: 'video/avc',
      frameRate: null,
    },
    {
      peakBitrate: 1068000,
      size: { height: 356, width: 854 },
      bitrate: 1068000,
      averageBitrate: null,
      isSupported: true,
      id: 'video/480p/playlist.m3u8',
      mimeType: 'video/avc',
      frameRate: null,
    },
    {
      peakBitrate: 518000,
      size: { height: 178, width: 426 },
      bitrate: 518000,
      averageBitrate: null,
      isSupported: true,
      id: 'video/240p/playlist.m3u8',
      mimeType: 'video/avc',
      frameRate: null,
    },
  ],
  availableAudioTracks: [
    { language: 'en', label: 'Original' },
    { language: 'en', label: 'Music Only' },
  ],
};

// END: - Expected return values from SourceLoadEventPayload

interface TestOptions {
  expectLoad: boolean;
  expectPlay: boolean;
  expectAudioTracks: boolean;
  expectSubtitleTracks: boolean;
}

export async function test({ describe, expect, it, ...t }, { setPortalChild, cleanupPortal }: any) {
  let player: VideoPlayer | null = null;

  t.beforeEach(() => {
    player = createVideoPlayer(null);
    // When testing on own device playing music (e.g. spotify), avoid pausing the music during tests.
    player.audioMixingMode = 'mixWithOthers';
  });

  t.afterEach(async () => {
    if (player) {
      try {
        player.release();
        cleanupPortal();
      } catch (error: any) {
        console.warn('Player release error:', error.message);
      }
      player = null;
    }
  });

  const defaultOptions: TestOptions = {
    expectLoad: true,
    expectPlay: true,
    expectAudioTracks: false,
    expectSubtitleTracks: false,
  };

  /**
   * Reusable function to run the standard suite of tests for a given source.
   */
  const runSourceTest = (
    label: string,
    source: VideoSourceObject,
    expectedData: SourceLoadEventPayload,
    options: Partial<TestOptions> = {}
  ) => {
    const opts = { ...defaultOptions, ...options };

    describe(label, () => {
      it('Sets the source via constructor', async () => {
        player = createVideoPlayer(source);

        const payload = await waitForEvent(player, 'sourceChange');
        expect(payload.source).toBeDefined();
        const sourceObject = source as VideoSourceObject;
        const payloadSource = payload.source as VideoSourceObject;

        // Normalize checks between URI sources and Asset ID sources
        if ('uri' in sourceObject && sourceObject.uri) {
          expect(payloadSource.uri).toEqual(sourceObject.uri);
        }
      });

      it('Sets the source via replaceAsync', async () => {
        player.replaceAsync(source);

        const payload = await waitForEvent(player, 'sourceChange');
        expect(payload.source).toBeDefined();
        const sourceObject = source as VideoSourceObject;
        const payloadSource = payload.source as VideoSourceObject;

        if ('uri' in sourceObject && sourceObject.uri) {
          expect(payloadSource.uri).toEqual(sourceObject.uri);
        }
      });

      if (opts.expectLoad) {
        it('loads source data', async () => {
          await player.replaceAsync(source);
          const payload = await waitForEvent(player, 'sourceLoad');
          const payloadVideoSource = payload.videoSource as VideoSourceObject;

          expect(payloadVideoSource).toBeDefined();
          expect(Math.abs(payload.duration - expectedData.duration)).toBeLessThan(0.1);
          expect(payloadVideoSource.metadata).toEqual(source.metadata);
        });

        it('loads video track info', async () => {
          await player.replaceAsync(source);
          const payload = await waitForEvent(player, 'sourceLoad');

          expect(payload.availableVideoTracks).toBeDefined();
          expect(payload.availableVideoTracks.length).toBeGreaterThanOrEqual(
            expectedData.availableVideoTracks.length
          );

          expectedData.availableVideoTracks.forEach((expectedTrack, index) => {
            const actualTrack = payload.availableVideoTracks[index];

            expect(actualTrack).toBeDefined();

            // Bitrate (allow slight variance)
            if (actualTrack.averageBitrate && expectedTrack.averageBitrate) {
              expect(
                Math.abs(actualTrack.averageBitrate - expectedTrack.averageBitrate)
              ).toBeLessThan(10);
            }

            if (expectedTrack.frameRate) {
              expect(actualTrack.frameRate).toEqual(expectedTrack.frameRate);
            }

            // Size (allow rounding differences of 1px)
            const widthDiff = Math.abs(actualTrack.size.width - expectedTrack.size.width);
            const heightDiff = Math.abs(actualTrack.size.height - expectedTrack.size.height);
            expect(widthDiff).toBeLessThanOrEqual(1);
            expect(heightDiff).toBeLessThanOrEqual(1);

            expect(actualTrack.mimeType).toContain(expectedTrack.mimeType);
          });
        });

        if (opts.expectAudioTracks) {
          it('loads audio track info', async () => {
            await player.replaceAsync(source);
            const payload = await waitForEvent(player, 'sourceLoad');
            expect(payload.availableAudioTracks).toBeDefined();
            expect(payload.availableAudioTracks.length).toBeGreaterThanOrEqual(1);
            expect(payload.availableAudioTracks[0].label).toBeDefined();
            expect(payload.availableAudioTracks[0].language).toBeDefined();
          });
        }

        if (opts.expectSubtitleTracks) {
          it('loads subtitle track info', async () => {
            await player.replaceAsync(source);

            const payload = await waitForEvent(player, 'sourceLoad');
            expect(payload.availableSubtitleTracks).toBeDefined();
            expect(payload.availableSubtitleTracks.length).toBeGreaterThanOrEqual(
              expectedData.availableSubtitleTracks.length
            );

            expectedData.availableSubtitleTracks.forEach((expectedTrack, index) => {
              const actualTrack = payload.availableSubtitleTracks[index];
              expect(actualTrack).toBeDefined();
              if (expectedTrack.language) {
                expect(actualTrack.language).toEqual(expectedTrack.language);
              }
              if (expectedTrack.label) {
                expect(actualTrack.label).toEqual(expectedTrack.label);
              }
            });
          });
        }
      }

      if (opts.expectPlay) {
        it('Plays the video', async () => {
          await player.replaceAsync(source);
          const payload = await waitForEvent(player, 'playingChange', () => {
            player.play();
          });
          expect(payload).toBeDefined();
          expect(payload.isPlaying).toBe(true);
        });
      }
    });
  };

  describe('VideoSources', () => {
    runSourceTest('Remote MP4 source', bigBuckBunnySource, bigBuckBunnySourceData, {
      expectAudioTracks: false,
      expectSubtitleTracks: false,
    });

    runSourceTest('Local Asset source', localVideoSource, localVideoSourceData, {
      expectAudioTracks: true,
      expectSubtitleTracks: false,
    });

    runSourceTest('Remote HLS source', hlsSource, hlsSourceData, {
      expectAudioTracks: true,
      expectSubtitleTracks: true,
    });

    describe('Broken remote source', () => {
      it('Fails to play broken video source', async () => {
        await player.replaceAsync(brokenSource);
        const payload = await waitForEvent(player, 'statusChange');
        expect(payload).toBeDefined();
        expect(payload.error).toBeDefined();
      });
    });
  });

  describe('Video Player Events', () => {
    const runStatusEventTest = (expectedStatus: VideoPlayerStatus, source: VideoSource) => {
      it(`Receives ${expectedStatus} when loading a ${source !== null ? 'new' : 'null'} source`, async () => {
        const promise = waitForEventTo(
          player,
          'statusChange',
          (payload) => payload.status === expectedStatus
        );
        if (source == null) {
          // Make sure that the player is not idle
          await player.replaceAsync(bigBuckBunnySource);
        }
        await player.replaceAsync(source);
        await promise;
      });
    };

    describe('Receives statusChange change events', () => {
      runStatusEventTest('idle', null);
      runStatusEventTest('loading', bigBuckBunnySource);
      runStatusEventTest('readyToPlay', bigBuckBunnySource);
    });

    it('Receives playbackRateChange event', async () => {
      await waitForEvent(player, 'playbackRateChange', () => {
        player.playbackRate = 0.5;
      });
      expect(player.playbackRate).toBe(0.5);

      await waitForEvent(player, 'playbackRateChange', () => {
        player.playbackRate = 1.5;
      });
      expect(player.playbackRate).toBe(1.5);
    });

    it('Receives volumeChange event', async () => {
      let promise = waitForEvent(player, 'volumeChange');
      player.volume = 0.5;
      expect((await promise).volume).toBe(0.5);

      promise = waitForEvent(player, 'volumeChange');
      player.volume = 0.75;
      expect((await promise).volume).toBe(0.75);

      promise = waitForEvent(player, 'volumeChange');
      player.volume = 1;
      expect((await promise).volume).toBe(1);
    });

    it('Receives mutedChange event', async () => {
      let promise = waitForEvent(player, 'mutedChange');
      player.muted = true;
      expect((await promise).muted).toBe(true);

      promise = waitForEvent(player, 'mutedChange');
      player.muted = false;
      expect((await promise).muted).toBe(false);
    });

    it('Receives playToEnd event', async () => {
      await replaceAndLoadPlayerSource(player, localVideoSource);
      player.play();
      player.currentTime = 13;
      player.play();
      await waitForEvent(player, 'playToEnd');
    });

    it('Receives timeUpdate event', async () => {
      const times: TimeUpdateEventPayload[] = [];
      player.replaceAsync(bigBuckBunnySource);
      player.timeUpdateEventInterval = 0.1;
      player.play();

      for (let i = 0; i < 5; i++) {
        const payload = await waitForEvent(player, 'timeUpdate');
        times.push(payload);
      }
      expect(times[0].currentTime).toBeDefined();
      expect(times[0].bufferedPosition).toBeDefined();
      player.timeUpdateEventInterval = 0;
    });

    it('Receives sourceChange event', async () => {
      const promise = waitForEvent(player, 'sourceChange');
      player.replaceAsync(elephantsDreamSource);
      const payload = await promise;
      const source = payload.source as VideoSourceObject;
      expect(source).toBeDefined();
      expect(source.uri).toEqual(elephantsDreamSource.uri);
      expect(source.metadata).toEqual(elephantsDreamSource.metadata);
    });

    describe('Subtitle Tracks Events', () => {
      let availableSubtitleTracks: SubtitleTrack[];
      it('Receives availableSubtitleTracksChange event', async () => {
        const promise = waitForEvent(player, 'availableSubtitleTracksChange');
        player.replaceAsync(hlsSource);
        const payload = await promise;
        expect(payload.availableSubtitleTracks).toBeTruthy();
        expect(payload.availableSubtitleTracks.length).toEqual(4);
        availableSubtitleTracks = payload.availableSubtitleTracks;
      });

      it('Receives subtitleTrackChange event', async () => {
        await replaceAndLoadPlayerSource(player, hlsSource);

        const promise = waitForEvent(player, 'subtitleTrackChange');
        player.subtitleTrack = availableSubtitleTracks[2];
        const payload = await promise;

        expect(payload.subtitleTrack).toBeTruthy();
        expect(payload.subtitleTrack.label).toEqual(availableSubtitleTracks[2].label);
        expect(payload.subtitleTrack.language).toEqual(availableSubtitleTracks[2].language);
      });
    });

    describe('Audio Tracks Events', () => {
      let availableAudioTracks: SubtitleTrack[];
      it('Receives availableAudioTracksChange event', async () => {
        const promise = waitForEvent(player, 'availableAudioTracksChange');
        player.replaceAsync(hlsSource);
        const payload = await promise;
        expect(payload.availableAudioTracks).toBeTruthy();
        // For this source ExoPlayer can decode more audio tracks than AVPlayer
        expect(payload.availableAudioTracks.length).toEqual(2);
        availableAudioTracks = payload.availableAudioTracks;
      });

      it('Receives audioTrackChange event', async () => {
        await replaceAndLoadPlayerSource(player, hlsSource);

        const promise = waitForEvent(player, 'audioTrackChange');
        player.audioTrack = availableAudioTracks[1];
        const payload = await promise;

        expect(payload.audioTrack).toBeTruthy();
        expect(payload.audioTrack.label).toEqual(availableAudioTracks[1].label);
        expect(payload.audioTrack.language).toEqual(availableAudioTracks[1].language);
      });
    });

    describe('Video Tracks Events', () => {
      it('Receives videoTrackChange event', async () => {
        await player.replaceAsync(hlsSource);
        player.play();
        const payload = await waitForEventTo(
          player,
          'videoTrackChange',
          (payload) => !!payload.videoTrack
        );

        expect(payload.videoTrack).toBeTruthy();
        expect(payload.videoTrack.size).toBeDefined();
        expect(payload.videoTrack.mimeType).toBeDefined();
        expect(payload.videoTrack.frameRate).toBeDefined();
        expect(payload.videoTrack.mimeType).toBeDefined();
      });
    });
  });

  describe('VideoViewEvents', () => {
    /*
     * Only testing a single event, because all other events require user input
     */
    it('Emits onFistFrameRendered', async () => {
      await replaceAndLoadPlayerSource(player, localVideoSource);
      await mountAndWaitFor(
        <VideoView player={player} style={{ height: 100, width: 100 }} />,
        'onFirstFrameRender',
        setPortalChild
      );
      cleanupPortal();
    });
  });

  describe('VideoPlayer properties', () => {
    it('player.loop makes the video loop', async () => {
      await new Promise(async (resolve) => {
        await replaceAndLoadPlayerSource(player, localVideoSource);
        player.currentTime = 15;
        player.loop = true;
        player.play();
        setTimeout(() => {
          expect(player.currentTime).toBeLessThan(15);
          resolve(null);
        }, 1000);
      });
    });

    it(`player.muted`, async () => {
      player.muted = true;
      expect(player.muted).toEqual(true);
      player.muted = false;
      expect(player.muted).toEqual(false);
    });

    it(`player.volume`, async () => {
      player.volume = 0.75;
      expect(player.volume).toEqual(0.75);
    });
    it(`player.currentTime`, async () => {
      await player.replaceAsync(localVideoSource);
      player.currentTime = 7;
      await waitForEventTo(player, 'statusChange', (payload) => {
        if (payload.status === 'readyToPlay') {
          expect(player.currentTime).toBeCloseTo(7);
          return true;
        }
        return false;
      });
    });

    it(`player.duration`, async () => {
      await replaceAndLoadPlayerSource(player, localVideoSource);
      expect(player.duration).toBeCloseTo(15, -1);
    });

    it(`player.preservesPitch`, async () => {
      await replaceAndLoadPlayerSource(player, localVideoSource);
      player.preservesPitch = true;
      expect(player.preservesPitch).toEqual(true);
    });

    it(`player.playbackRate`, async () => {
      await replaceAndLoadPlayerSource(player, localVideoSource);

      player.playbackRate = 4;
      player.currentTime = 0;
      expect(player.playbackRate).toEqual(4);

      if (player.status !== 'readyToPlay') {
        await waitForEventTo(player, 'statusChange', (payload) => payload.status === 'readyToPlay');
      }
      player.play();

      await new Promise((resolve) => setTimeout(resolve, 3000));
      expect(player.currentTime).toBeCloseTo(12, -1);
    });

    it(`player.status`, async () => {
      expect(player.status).toEqual('idle');

      await player.replaceAsync(bigBuckBunnySource);

      await waitForEventTo(player, 'statusChange', (payload) => {
        expect(player.status).toEqual(payload.status);
        return payload.status === 'readyToPlay';
      });
    });

    it(`player.bufferOptions (requires decent network!)`, async () => {
      player.bufferOptions = {
        preferredForwardBufferDuration: 5,
        prioritizeTimeOverSizeThreshold: true,
      };
      // Using HLS source, since Apple devices ignore buffer settings for mp4s
      await player.replaceAsync(hlsSource);
      await new Promise((resolve) => {
        setTimeout(() => {
          expect(Math.abs(player.bufferedPosition - 5)).toBeLessThan(2);
          resolve(null);
        }, 4000);
      });
    });

    it(`player.availableVideoTracks`, async () => {
      await replaceAndLoadPlayerSource(player, hlsSource);
      expect(player.availableVideoTracks).toBeDefined();
      expect(player.availableVideoTracks.length).toEqual(hlsSourceData.availableVideoTracks.length);
      player.availableVideoTracks.forEach((track) => {
        expect(track.mimeType).toBeTruthy();
        expect(track.bitrate).toBeTruthy();
        expect(track.isSupported).toBe(true);
      });
    });

    it(`player.availableAudioTracks`, async () => {
      await replaceAndLoadPlayerSource(player, hlsSource);
      expect(player.availableAudioTracks).toBeDefined();
      // ExoPlayer can find more audioTracks than AVKit for our HLS source
      expect(player.availableAudioTracks.length).toEqual(2);
      player.availableAudioTracks.forEach((track) => {
        expect(track.language).toBeTruthy();
        expect(track.label).toBeTruthy();
      });
    });

    it(`player.availableSubtitleTracks`, async () => {
      await replaceAndLoadPlayerSource(player, hlsSource);
      expect(player.availableSubtitleTracks).toBeDefined();
      expect(player.availableSubtitleTracks.length).toEqual(
        hlsSourceData.availableSubtitleTracks.length
      );
      player.availableSubtitleTracks.forEach((track) => {
        expect(track.language).toBeTruthy();
        expect(track.label).toBeTruthy();
      });
    });

    describe('Following properties tests are getter/setter-only, not testing functionality', () => {
      it('player.staysActiveInBackground', () => {
        player.staysActiveInBackground = true;
        expect(player.staysActiveInBackground).toBe(true);
        player.staysActiveInBackground = false;
        expect(player.staysActiveInBackground).toBe(false);
      });

      it('player.showNowPlayingNotification', () => {
        player.showNowPlayingNotification = false;
        expect(player.showNowPlayingNotification).toBe(false);
        player.showNowPlayingNotification = true;
        expect(player.showNowPlayingNotification).toBe(true);
      });

      it('player.allowsExternalPlayback', () => {
        player.allowsExternalPlayback = false;
        expect(player.allowsExternalPlayback).toBe(false);
        player.allowsExternalPlayback = true;
        expect(player.allowsExternalPlayback).toBe(true);
      });

      it('player.audioMixingMode', () => {
        player.audioMixingMode = 'duckOthers';
        expect(player.audioMixingMode).toBe('duckOthers');
        player.audioMixingMode = 'mixWithOthers';
        expect(player.audioMixingMode).toBe('mixWithOthers');
        // 'auto' is the default but let's check setting it explicitly if supported or just check other values
        player.audioMixingMode = 'doNotMix';
        expect(player.audioMixingMode).toBe('doNotMix');
      });

      it('player.timeUpdateEventInterval', () => {
        player.timeUpdateEventInterval = 0.5;
        expect(player.timeUpdateEventInterval).toBe(0.5);
        player.timeUpdateEventInterval = 1.0;
        expect(player.timeUpdateEventInterval).toBe(1.0);
      });
    });
  });

  describe('VideoPlayer methods', () => {
    it(`player.play()`, async () => {
      await player.replaceAsync(bigBuckBunnySource);
      player.play();
      await waitForEventTo(player, 'playingChange', (payload) => payload.isPlaying === true);
      expect(player.playing).toEqual(true);
    });

    it(`player.pause()`, async () => {
      await player.replaceAsync(bigBuckBunnySource);
      player.play();
      await waitForEventTo(player, 'playingChange', (payload) => payload.isPlaying === true);
      player.pause();
      await waitForEventTo(player, 'playingChange', (payload) => payload.isPlaying === false);

      expect(player.playing).toEqual(false);
    });

    it('player.replay()', async () => {
      await player.replaceAsync(localVideoSource);
      player.currentTime = 5;

      await waitForEventTo(player, 'statusChange', (p) => p.status === 'readyToPlay');

      // Ensure we are not at the start
      expect(player.currentTime).toBeGreaterThan(0);

      player.replay();

      // Should start playing
      await waitForEventTo(player, 'playingChange', (payload) => payload.isPlaying === true);

      // Should be near the beginning
      expect(player.currentTime).toBeLessThan(1);
      expect(player.playing).toBe(true);
    });

    it(`player.seekBy()`, async () => {
      await replaceAndLoadPlayerSource(player, localVideoSource);
      player.seekBy(5);
      player.play();
      await waitForEvent(player, 'playingChange', () => player.play());

      expect(player.currentTime).toBeCloseTo(5, 1);
    });

    it('player.generateThumbnailsAsync()', async () => {
      await player.replaceAsync(localVideoSource);
      await waitForEvent(player, `sourceLoad`);
      const thumbnails = await player.generateThumbnailsAsync([1, 2, 3]);

      expect(thumbnails).toBeTruthy();
      expect(thumbnails.length).toEqual(3);
      for (const thumbnail of thumbnails) {
        expect(thumbnail.width).toBeCloseTo(569);
        expect(thumbnail.height).toBeCloseTo(320);
      }
    });
  });
}

async function replaceAndLoadPlayerSource(
  player: VideoPlayer,
  source: VideoSource
): Promise<SourceLoadEventPayload> {
  await player.replaceAsync(source);
  return await waitForEvent(player, `sourceLoad`);
}

type EventPayload<Func> = Func extends (...args: any[]) => any
  ? Parameters<Func> extends [infer FirstArg, ...any[]]
    ? FirstArg
    : void
  : never;

async function waitForEvent<EventName extends keyof VideoPlayerEvents>(
  player: VideoPlayer,
  eventName: EventName,
  postAddListenerCallback: () => void | null = null
): Promise<EventPayload<VideoPlayerEvents[EventName]>> {
  let subscription: EventSubscription | null = null;
  try {
    return await new Promise((resolve) => {
      subscription = player.addListener(eventName, ((payload: any) => {
        resolve(payload);
      }) as VideoPlayerEvents[EventName]);
      postAddListenerCallback?.();
    });
  } finally {
    subscription?.remove();
  }
}

async function waitForEventTo<EventName extends keyof VideoPlayerEvents>(
  player: VideoPlayer,
  eventName: EventName,
  comparator: (payload: EventPayload<VideoPlayerEvents[EventName]>) => boolean,
  retries: number = 3
): Promise<EventPayload<VideoPlayerEvents[EventName]>> {
  let subscription: EventSubscription | null = null;
  let retriesLeft = retries;

  try {
    return await new Promise((resolve, reject) => {
      subscription = player.addListener(eventName, ((payload: any) => {
        if (comparator(payload)) {
          resolve(payload);
        } else {
          if (retriesLeft <= 0) {
            reject(
              new Error(
                `waitForEventToEqual: Comparator failed to return true after ${retries} retries.`
              )
            );
          }
          retriesLeft--;
        }
      }) as VideoPlayerEvents[EventName]);
    });
  } finally {
    subscription?.remove();
  }
}
