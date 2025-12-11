'use strict';

import { EventSubscription, Platform } from 'expo-modules-core';
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
  uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  metadata: {
    title: 'Big Buck Bunny',
    artist: 'The Open Movie Project',
    artwork:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Big_buck_bunny_poster_big.jpg/1200px-Big_buck_bunny_poster_big.jpg',
  },
};

const elephantsDreamSource = {
  uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  metadata: {
    title: 'Elephants Dream',
    artist: 'Blender Foundation',
    artwork: 'https://upload.wikimedia.org/wikipedia/commons/0/0c/ElephantsDreamPoster.jpg',
  },
};

export const hlsSource = {
  uri: 'https://bitmovin-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
  metadata: {
    title: 'Sintel',
    artist: 'Blender Foundation',
    artwork:
      'https://bookshow.blurb.com/bookshow/cache/P14464689/md/cover_2.jpeg?access_key=a096a6a606efe615ac87edc04766c661',
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
      id: '2',
      bitrate: 1991287,
      frameRate: 24,
      size: { width: 1280, height: 720 },
      mimeType: 'video/avc',
      isSupported: true,
    },
  ],
  videoSource: {
    uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    metadata: {
      artist: 'The Open Movie Project',
      title: 'Big Buck Bunny',
      artwork:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Big_buck_bunny_poster_big.jpg/1200px-Big_buck_bunny_poster_big.jpg',
    },
    drm: null,
    headers: null,
    useCaching: false,
    contentType: 'auto',
  },
  availableAudioTracks: [],
  availableSubtitleTracks: [],
  duration: 596.4583333333334,
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
      isSupported: true,
      bitrate: 240787,
      frameRate: 24,
      mimeType: 'video/mp4v',
      size: { width: 569, height: 320 },
      id: '1',
    },
  ],
  duration: 15,
};

const hlsSourceData: SourceLoadEventPayload = {
  videoSource: {
    uri: 'https://bitmovin-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    drm: null,
    contentType: 'auto',
    metadata: {
      title: 'Sintel',
      artist: 'Blender Foundation',
      artwork:
        'https://bookshow.blurb.com/bookshow/cache/P14464689/md/cover_2.jpeg?access_key=a096a6a606efe615ac87edc04766c661',
    },
    headers: null,
    useCaching: false,
  },
  duration: 888,
  availableSubtitleTracks: [
    { language: 'de', label: 'German' },
    { language: 'en', label: 'English' },
    { language: 'es', label: 'Spanish' },
    { label: 'French', language: 'fr' },
  ],
  availableVideoTracks: [
    {
      frameRate: null,
      id: 'video/250kbit.m3u8',
      size: { height: 180, width: 422 },
      bitrate: 258157,
      mimeType: 'video/avc',
      isSupported: true,
    },
    {
      mimeType: 'video/avc',
      id: 'video/500kbit.m3u8',
      size: { width: 638, height: 272 },
      frameRate: null,
      isSupported: true,
      bitrate: 520929,
    },
    {
      id: 'video/800kbit.m3u8',
      frameRate: null,
      bitrate: 831270,
      isSupported: true,
      size: { height: 272, width: 638 },
      mimeType: 'video/avc',
    },
    {
      mimeType: 'video/avc',
      size: { width: 958, height: 408 },
      frameRate: null,
      bitrate: 1144430,
      isSupported: true,
      id: 'video/1100kbit.m3u8',
    },
    {
      id: 'video/1500kbit.m3u8',
      frameRate: null,
      size: { height: 554, width: 1277 },
      mimeType: 'video/avc',
      bitrate: 1558322,
      isSupported: true,
    },
    {
      bitrate: 4149264,
      id: 'video/4000kbit.m3u8',
      isSupported: true,
      frameRate: null,
      size: { width: 1921, height: 818 },
      mimeType: 'video/avc',
    },
    {
      size: { height: 818, width: 1921 },
      mimeType: 'video/avc',
      isSupported: true,
      frameRate: null,
      id: 'video/6000kbit.m3u8',
      bitrate: 6214307,
    },
    {
      mimeType: 'video/avc',
      frameRate: null,
      id: 'video/10000kbit.m3u8',
      size: { width: 4096, height: 1744 },
      bitrate: 10285391,
      isSupported: true,
    },
  ],
  availableAudioTracks: [
    { language: 'en', label: 'English' },
    { language: 'dubbing', label: 'dubbing' },
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
            if (actualTrack.bitrate && expectedTrack.bitrate) {
              expect(Math.abs(actualTrack.bitrate - expectedTrack.bitrate)).toBeLessThan(10);
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
      let promise = waitForEvent(player, 'playbackRateChange');
      player.playbackRate = 0.5;
      expect((await promise).playbackRate).toBe(0.5);

      promise = waitForEvent(player, 'playbackRateChange');
      player.playbackRate = 1.5;
      expect((await promise).playbackRate).toBe(1.5);

      promise = waitForEvent(player, 'playbackRateChange');
      player.playbackRate = 1;
      expect((await promise).playbackRate).toBe(1);
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
        expect(payload.availableAudioTracks.length).toEqual(Platform.OS === 'ios' ? 2 : 4);
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
      await replaceAndLoadPlayerSource(player, localVideoSource);
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

      await waitForEventTo(player, 'statusChange', (payload) => payload.status === 'readyToPlay');
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
      expect(player.availableAudioTracks.length).toEqual(Platform.OS === 'ios' ? 2 : 4);
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
      await replaceAndLoadPlayerSource(player, localVideoSource);
      player.seekBy(5);
      await waitForEventTo(player, 'statusChange', (payload) => payload.status === 'readyToPlay');

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

      await waitForEventTo(player, `statusChange`, (payload) => payload.status === 'readyToPlay');
      if (player.status !== 'readyToPlay') {
        await waitForEventTo(player, `statusChange`, (payload) => payload.status === 'readyToPlay');
      }
      expect(player.currentTime).toBeCloseTo(5);
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
