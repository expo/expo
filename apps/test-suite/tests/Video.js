'use strict';

import React from 'react';
import { forEach } from 'lodash';
import { Video } from 'expo-av';
import { Asset } from 'expo-asset';
import { Platform } from 'react-native';

import { waitFor, retryForStatus, mountAndWaitFor as originalMountAndWaitFor } from './helpers';

export const name = 'Video';

export function canRunAsync({ isAutomated }) {
  // Crashes app when mounting component
  return !isAutomated;
}

const imageRemoteSource = { uri: 'http://via.placeholder.com/350x150' };
const videoRemoteSource = { uri: 'http://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4' };
const redirectingVideoRemoteSource = { uri: 'http://bit.ly/2mcW40Q' };
let webmSource = require('../assets/unsupported_bunny.webm');
let imageSource = require('../assets/black-128x256.png');
const mp4Source = require('../assets/big_buck_bunny.mp4');
const hlsStreamUri = 'http://qthttp.apple.com.edgesuite.net/1010qwoeiuryfg/sl.m3u8';
const hlsStreamUriWithRedirect = 'http://bit.ly/1iy90bn';
let source = null; // Local URI of the downloaded default source is set in a beforeAll callback.

const style = { width: 200, height: 200 };

export function test(
  { describe, beforeAll, afterEach, it, xit, expect, jasmine, ...t },
  { setPortalChild, cleanupPortal }
) {
  beforeAll(async () => {
    const mp4Asset = Asset.fromModule(mp4Source);
    await mp4Asset.downloadAsync();
    source = { uri: mp4Asset.localUri };

    const imageAsset = Asset.fromModule(imageSource);
    await imageAsset.downloadAsync();
    imageSource = { uri: imageAsset.localUri };

    const webmAsset = Asset.fromModule(webmSource);
    await webmAsset.downloadAsync();
    webmSource = { uri: webmAsset.localUri };
  });

  let instance = null;
  const refSetter = ref => {
    instance = ref;
  };

  afterEach(async () => {
    instance = null;
    await cleanupPortal();
  });

  const mountAndWaitFor = (child, propName = 'onLoad') =>
    originalMountAndWaitFor(child, propName, setPortalChild);

  const testPropValues = (propName, values, moreTests) =>
    describe(`Video.props.${propName}`, () => {
      forEach(values, value =>
        it(`sets it to \`${value}\``, async () => {
          let instance = null;
          const refSetter = ref => {
            instance = ref;
          };
          const element = React.createElement(Video, {
            style,
            source,
            ref: refSetter,
            [propName]: value,
          });
          await mountAndWaitFor(element, 'onLoad');
          await retryForStatus(instance, { [propName]: value });
        })
      );

      if (moreTests) {
        moreTests();
      }
    });

  const testNoCrash = (propName, values) =>
    describe(`Video.props.${propName}`, () => {
      forEach(values, value =>
        it(`setting to \`${value}\` doesn't crash`, async () => {
          const element = React.createElement(Video, { style, source, [propName]: value });
          await mountAndWaitFor(element, 'onLoad');
        })
      );
    });

  const testPropSetter = (propName, propSetter, values, moreTests) =>
    describe(`Video.${propSetter}`, () => {
      forEach(values, value =>
        it(`sets it to \`${value}\``, async () => {
          let instance = null;
          const refSetter = ref => {
            instance = ref;
          };
          const element = React.createElement(Video, {
            style,
            source,
            ref: refSetter,
            [propName]: value,
          });
          await mountAndWaitFor(element);
          await instance[propSetter](value);
          const status = await instance.getStatusAsync();
          expect(status).toEqual(jasmine.objectContaining({ [propName]: value }));
        })
      );

      if (moreTests) {
        moreTests();
      }
    });

  describe('Video.props.onLoadStart', () => {
    it('gets called when the source starts loading', async () => {
      await mountAndWaitFor(<Video style={style} source={source} />, 'onLoadStart');
    });
  });

  describe('Video.props.onLoad', () => {
    it('gets called when the source loads', async () => {
      await mountAndWaitFor(<Video style={style} source={source} />, 'onLoad');
    });

    it('gets called right when the video starts to play if it should autoplay', async () => {
      const status = await mountAndWaitFor(
        <Video style={style} source={videoRemoteSource} shouldPlay />,
        'onLoad'
      );
      expect(status.positionMillis).toEqual(0);
    });
  });

  describe('Video.props.source', () => {
    it('mounts even when the source is undefined', async () => {
      await mountAndWaitFor(<Video style={style} />, 'ref');
    });

    it('loads `require` source', async () => {
      const status = await mountAndWaitFor(<Video style={style} source={mp4Source} />);
      expect(status).toEqual(jasmine.objectContaining({ isLoaded: true }));
    });

    it('loads `Asset` source', async () => {
      const status = await mountAndWaitFor(
        <Video style={style} source={Asset.fromModule(mp4Source)} />
      );
      expect(status).toEqual(jasmine.objectContaining({ isLoaded: true }));
    });

    it('loads `uri` source', async () => {
      const status = await mountAndWaitFor(<Video style={style} source={videoRemoteSource} />);
      expect(status).toEqual(jasmine.objectContaining({ isLoaded: true }));
    });

    if (Platform.OS === 'android') {
      it('calls onError when the file from the Internet redirects to a non-standard content', async () => {
        const error = await mountAndWaitFor(
          <Video
            style={style}
            source={{
              uri: hlsStreamUriWithRedirect,
            }}
          />,
          'onError'
        );
        expect(error.toLowerCase()).toContain('format');
      });
      it('loads the file from the Internet that redirects to non-standard content when overrideFileExtensionAndroid is provided', async () => {
        let hasBeenRejected = false;
        try {
          const status = await mountAndWaitFor(
            <Video
              style={style}
              source={{ uri: hlsStreamUriWithRedirect, overrideFileExtensionAndroid: 'm3u8' }}
            />
          );
          expect(status).toEqual(jasmine.objectContaining({ isLoaded: true }));
        } catch (error) {
          hasBeenRejected = true;
        }
        expect(hasBeenRejected).toBe(false);
      });
    } else {
      it('loads the file from the Internet that redirects to non-standard content', async () => {
        let hasBeenRejected = false;
        try {
          const status = await mountAndWaitFor(
            <Video style={style} source={{ uri: hlsStreamUriWithRedirect }} />
          );
          expect(status).toEqual(jasmine.objectContaining({ isLoaded: true }));
        } catch (error) {
          hasBeenRejected = true;
        }
        expect(hasBeenRejected).toBe(false);
      });
    }

    it('loads HLS stream', async () => {
      const status = await mountAndWaitFor(<Video style={style} source={{ uri: hlsStreamUri }} />);
      expect(status).toEqual(jasmine.objectContaining({ isLoaded: true }));
    });

    it('loads redirecting `uri` source', async () => {
      const status = await mountAndWaitFor(
        <Video style={style} source={redirectingVideoRemoteSource} />
      );
      expect(status).toEqual(jasmine.objectContaining({ isLoaded: true }));
    });

    // These two are flaky on iOS, sometimes they pass, sometimes they timeout.
    it('calls onError when given image source', async () => {
      const error = await mountAndWaitFor(
        <Video style={style} source={imageSource} shouldPlay />,
        'onError'
      );
      expect(error).toBeDefined();
    }, 30000);

    if (Platform.OS === 'ios') {
      it('calls onError with a reason when unsupported format given (WebM)', async () => {
        const error = await mountAndWaitFor(
          <Video style={style} source={webmSource} shouldPlay />,
          'onError'
        );
        // We cannot check for the specific reason,
        // as sometimes it isn't what we would expect it to be
        // (we'd expect "This media format is not supported."),
        // so let's check whether there is a reason-description separator,
        // which is included only if `localizedFailureReason` is not nil.
        expect(error).toContain(' - ');
      }, 30000);
    }
  });

  testNoCrash('useNativeControls', [true, false]);
  testNoCrash('usePoster', [true, false]);
  testNoCrash('resizeMode', [
    Video.RESIZE_MODE_COVER,
    Video.RESIZE_MODE_CONTAIN,
    Video.RESIZE_MODE_STRETCH,
  ]);

  describe(`Video.props.posterSource`, () => {
    it("doesn't crash if is set to required image", async () => {
      const props = {
        style,
        source,
        posterSource: imageSource,
      };
      await mountAndWaitFor(<Video {...props} />);
    });

    it("doesn't crash if is set to uri", async () => {
      const props = {
        style,
        source,
        posterSource: imageRemoteSource,
      };
      await mountAndWaitFor(<Video {...props} />);
    });
  });

  describe(`Video.props.onReadyForDisplay`, () => {
    it('gets called with the `naturalSize` object', async () => {
      const props = {
        style,
        source,
      };
      const status = await mountAndWaitFor(<Video {...props} />, 'onReadyForDisplay');
      expect(status.naturalSize).toBeDefined();
      expect(status.naturalSize.width).toBeDefined();
      expect(status.naturalSize.height).toBeDefined();
      expect(status.naturalSize.orientation).toBeDefined();
    });

    it('gets called with the `status` object', async () => {
      const props = {
        style,
        source,
      };
      const status = await mountAndWaitFor(<Video {...props} />, 'onReadyForDisplay');
      expect(status.status).toBeDefined();
      expect(status.status.isLoaded).toBe(true);
    });

    it('gets called when the component uses native controls', async () => {
      const props = {
        style,
        source,
        useNativeControls: true,
      };
      const status = await mountAndWaitFor(<Video {...props} />, 'onReadyForDisplay');
      expect(status.status).toBeDefined();
      expect(status.status.isLoaded).toBe(true);
    });

    it("gets called when the component doesn't use native controls", async () => {
      const props = {
        style,
        source,
        useNativeControls: false,
      };
      const status = await mountAndWaitFor(<Video {...props} />, 'onReadyForDisplay');
      expect(status.status).toBeDefined();
      expect(status.status.isLoaded).toBe(true);
    });
  });

  describe('Video fullscreen player', () => {
    it('presents the player and calls callback func', async () => {
      const fullscreenUpdates = [];
      const onFullscreenUpdate = event => fullscreenUpdates.push(event.fullscreenUpdate);

      await mountAndWaitFor(
        <Video
          style={style}
          source={source}
          ref={refSetter}
          onFullscreenUpdate={onFullscreenUpdate}
        />,
        'onReadyForDisplay'
      );
      await instance.presentFullscreenPlayer();
      await waitFor(1000);

      expect(fullscreenUpdates).toEqual([
        Video.FULLSCREEN_UPDATE_PLAYER_WILL_PRESENT,
        Video.FULLSCREEN_UPDATE_PLAYER_DID_PRESENT,
      ]);

      await instance.dismissFullscreenPlayer();
      await waitFor(1000);

      expect(fullscreenUpdates).toEqual([
        Video.FULLSCREEN_UPDATE_PLAYER_WILL_PRESENT,
        Video.FULLSCREEN_UPDATE_PLAYER_DID_PRESENT,
        Video.FULLSCREEN_UPDATE_PLAYER_WILL_DISMISS,
        Video.FULLSCREEN_UPDATE_PLAYER_DID_DISMISS,
      ]);
    });

    if (Platform.OS === 'android') {
      it("raises an error if the code didn't wait for completion", async () => {
        let presentationError = null;
        let dismissalError = null;
        try {
          await mountAndWaitFor(
            <Video style={style} source={source} ref={refSetter} />,
            'onReadyForDisplay'
          );
          instance.presentFullscreenPlayer().catch(error => {
            presentationError = error;
          });
          await instance.dismissFullscreenPlayer();
        } catch (error) {
          dismissalError = error;
        }

        expect(presentationError).toBeDefined();
        expect(dismissalError).toBeDefined();
      });
    }

    it('rejects dismissal request if present request is being handled', async () => {
      await mountAndWaitFor(
        <Video style={style} source={source} ref={refSetter} />,
        'onReadyForDisplay'
      );
      let error = null;
      const presentationPromise = instance.presentFullscreenPlayer();
      try {
        await instance.dismissFullscreenPlayer();
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
      await presentationPromise;
      await instance.dismissFullscreenPlayer();
    });

    it('rejects presentation request if present request is already being handled', async () => {
      await mountAndWaitFor(
        <Video style={style} source={source} ref={refSetter} />,
        'onReadyForDisplay'
      );
      let error = null;
      const presentationPromise = instance.presentFullscreenPlayer();
      try {
        await instance.presentFullscreenPlayer();
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
      await presentationPromise;
      await instance.dismissFullscreenPlayer();
    });

    // NOTE(2018-10-17): Some of these tests are failing on iOS
    const unreliablyIt = Platform.OS === 'ios' ? xit : it;

    unreliablyIt(
      'rejects all but the last request to change fullscreen mode before the video loads',
      async () => {
        // Adding second clause sometimes crashes the application,
        // because by the time we call `present` second time,
        // the video loads, so it handles the first request properly,
        // rejects the second and it may reject the third request
        // if it tries to be handled while the first presentation request
        // is being handled.
        let firstErrored = false;
        // let secondErrored = false;
        let thirdErrored = false;
        // We're using remote source as this gives us time to request changes
        // before the video loads.
        const instance = await mountAndWaitFor(
          <Video style={style} source={videoRemoteSource} />,
          'ref'
        );
        instance.dismissFullscreenPlayer().catch(() => {
          firstErrored = true;
        });
        // instance.presentFullscreenPlayer().catch(() => (secondErrored = true));
        try {
          await instance.dismissFullscreenPlayer();
        } catch (_error) {
          thirdErrored = true;
        }

        if (!firstErrored) {
          // First present request finished too early so we cannot
          // test this behavior at all. Normally I would put
          // `t.pending` here, but as for the end of 2017 it doesn't work.
        } else {
          expect(firstErrored).toBe(true);
          // expect(secondErrored).toBe(true);
          expect(thirdErrored).toBe(false);
        }
        const pleaseDismiss = async () => {
          try {
            await instance.dismissFullscreenPlayer();
          } catch (error) {
            pleaseDismiss();
          }
        };
        await pleaseDismiss();
      }
    );
  });

  // Actually values 2.0 and -0.5 shouldn't be allowed, however at the moment
  // it is possible to set them through props successfully.
  testPropValues('volume', [0.5, 1.0, 2.0, -0.5]);
  testPropSetter('volume', 'setVolumeAsync', [0, 0.5, 1], () => {
    it('errors when trying to set it to 2', async () => {
      let error = null;
      try {
        const props = { style, source, ref: refSetter };
        await mountAndWaitFor(<Video {...props} />);
        await instance.setVolumeAsync(2);
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
      expect(error.toString()).toMatch(/value .+ between/);
    });

    it('errors when trying to set it to -0.5', async () => {
      let error = null;
      try {
        const props = { style, source, ref: refSetter };
        await mountAndWaitFor(<Video {...props} />);
        await instance.setVolumeAsync(-0.5);
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
      expect(error.toString()).toMatch(/value .+ between/);
    });
  });

  testPropValues('isMuted', [true, false]);
  testPropSetter('isMuted', 'setIsMutedAsync', [true, false]);

  testPropValues('isLooping', [true, false]);
  testPropSetter('isLooping', 'setIsLoopingAsync', [true, false]);

  // Actually values 34 and -0.5 shouldn't be allowed, however at the moment
  // it is possible to set them through props successfully.
  testPropValues('rate', [0.5, 1.0, 2, 34, -0.5]);
  testPropSetter('rate', 'setRateAsync', [0, 0.5, 1], () => {
    it('errors when trying to set it above 32', async () => {
      let error = null;
      try {
        const props = { style, source, ref: refSetter };
        await mountAndWaitFor(<Video {...props} />);
        await instance.setRateAsync(34);
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
      expect(error.toString()).toMatch(/value .+ between/);
    });

    it('errors when trying to set it under 0', async () => {
      let error = null;
      try {
        const props = { style, source, ref: refSetter };
        await mountAndWaitFor(<Video {...props} />);
        await instance.setRateAsync(-0.5);
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
      expect(error.toString()).toMatch(/value .+ between/);
    });
  });

  testPropValues('shouldPlay', [true, false]);
  testPropValues('shouldCorrectPitch', [true, false]);

  describe('Video.onPlaybackStatusUpdate', () => {
    it('gets called with `didJustFinish = true` when video is done playing', async () => {
      const onPlaybackStatusUpdate = jasmine.createSpy('onPlaybackStatusUpdate');
      const props = {
        onPlaybackStatusUpdate,
        source,
        style,
        ref: refSetter,
      };
      await mountAndWaitFor(<Video {...props} />);
      await retryForStatus(instance, { isBuffering: false, isLoaded: true });
      const status = await instance.getStatusAsync();
      await instance.setStatusAsync({
        shouldPlay: true,
        positionMillis: status.durationMillis - 500,
      });
      await retryForStatus(instance, { isPlaying: true });
      await new Promise(resolve => {
        setTimeout(() => {
          expect(onPlaybackStatusUpdate).toHaveBeenCalledWith(
            jasmine.objectContaining({ didJustFinish: true })
          );
          resolve();
        }, 1000);
      });
    });
  });

  /*describe('Video.setProgressUpdateIntervalAsync', () => {
      it('sets frequence of the progress updates', async () => {
        const onPlaybackStatusUpdate = jasmine.createSpy('onPlaybackStatusUpdate');
        const props = {
          style,
          source,
          ref: refSetter,
          shouldPlay: true,
          onPlaybackStatusUpdate,
        };
        await mountAndWaitFor(<Video {...props} />);
        const updateInterval = 100;
        await instance.setProgressUpdateIntervalAsync(updateInterval);
        await new Promise(resolve => {
          setTimeout(() => {
            const expectedArgsCount = Platform.OS === 'android' ? 5 : 9;
            expect(onPlaybackStatusUpdate.calls.count()).toBeGreaterThan(expectedArgsCount);

            const realMillis = map(
              takeRight(filter(flatten(onPlaybackStatusUpdate.calls.allArgs()), 'isPlaying'), 4),
              'positionMillis'
            );

            for (let i = 3; i > 0; i--) {
              const difference = Math.abs(realMillis[i] - realMillis[i - 1] - updateInterval);
              expect(difference).toBeLessThan(updateInterval / 2 + 1);
            }

            resolve();
          }, 1500);
        });
      });
    });*/

  describe('Video.setPositionAsync', () => {
    it('sets position of the video', async () => {
      const props = { style, source, ref: refSetter };
      await mountAndWaitFor(<Video {...props} />);
      await retryForStatus(instance, { isBuffering: false });
      const status = await instance.getStatusAsync();
      await retryForStatus(instance, { playableDurationMillis: status.durationMillis });
      const positionMillis = 500;
      await instance.setPositionAsync(positionMillis);
      await retryForStatus(instance, { positionMillis });
    });
  });

  describe('Video.loadAsync', () => {
    // NOTE(2018-03-08): Some of these tests are failing on iOS
    const unreliablyIt = Platform.OS === 'ios' ? xit : it;
    unreliablyIt('loads the video', async () => {
      const props = { style };
      const instance = await mountAndWaitFor(<Video {...props} />, 'ref');
      await instance.loadAsync(source);
      await retryForStatus(instance, { isLoaded: true });
    });

    // better positionmillis check
    unreliablyIt('sets the initial status', async () => {
      const props = { style };
      const instance = await mountAndWaitFor(<Video {...props} />, 'ref');
      const initialStatus = { volume: 0.5, isLooping: true, rate: 0.5 };
      await instance.loadAsync(source, { ...initialStatus, positionMillis: 1000 });
      await retryForStatus(instance, { isLoaded: true, ...initialStatus });
      const status = await instance.getStatusAsync();
      expect(status.positionMillis).toBeLessThan(1100);
      expect(status.positionMillis).toBeGreaterThan(900);
    });

    unreliablyIt('keeps the video instance after load when using poster', async () => {
      const instance = await mountAndWaitFor(<Video style={style} usePoster />, 'ref');
      await instance.loadAsync(source, { shouldPlay: true });
      await waitFor(500);
      await retryForStatus(instance, { isPlaying: true });
    });
  });

  describe('Video.unloadAsync', () => {
    it('unloads the video', async () => {
      const props = { style, source, ref: refSetter };
      await mountAndWaitFor(<Video {...props} />);
      await retryForStatus(instance, { isLoaded: true });
      await instance.unloadAsync();
      await retryForStatus(instance, { isLoaded: false });
    });
  });

  describe('Video.pauseAsync', () => {
    it('pauses the video', async () => {
      const props = { style, source, shouldPlay: true, ref: refSetter };
      await mountAndWaitFor(<Video {...props} />);
      await retryForStatus(instance, { isPlaying: true });
      await new Promise(r => setTimeout(r, 500));
      await instance.pauseAsync();
      await retryForStatus(instance, { isPlaying: false });
      const { positionMillis } = await instance.getStatusAsync();
      expect(positionMillis).toBeGreaterThan(0);
    });
  });

  describe('Video.playAsync', () => {
    // NOTE(2018-03-08): Some of these tests are failing on iOS
    const unreliablyIt = Platform.OS === 'ios' ? xit : it;

    it('plays the stopped video', async () => {
      const props = { style, source, ref: refSetter };
      await mountAndWaitFor(<Video {...props} />);
      await retryForStatus(instance, { isLoaded: true });
      await instance.playAsync();
      await retryForStatus(instance, { isPlaying: true });
    });

    it('plays the paused video', async () => {
      const props = { style, source, ref: refSetter };
      await mountAndWaitFor(<Video {...props} />);
      await retryForStatus(instance, { isLoaded: true });
      await instance.playAsync();
      await retryForStatus(instance, { isPlaying: true });
      await instance.pauseAsync();
      await retryForStatus(instance, { isPlaying: false });
      await instance.playAsync();
      await retryForStatus(instance, { isPlaying: true });
    });

    unreliablyIt('does not play video that played to an end', async () => {
      const onPlaybackStatusUpdate = jasmine.createSpy('onPlaybackStatusUpdate');
      const props = {
        onPlaybackStatusUpdate,
        source,
        style,
        ref: refSetter,
      };
      await mountAndWaitFor(<Video {...props} />);
      await retryForStatus(instance, { isBuffering: false, isLoaded: true });
      const status = await instance.getStatusAsync();
      await instance.setStatusAsync({
        shouldPlay: true,
        positionMillis: status.durationMillis - 500,
      });
      await new Promise(resolve => {
        setTimeout(() => {
          expect(onPlaybackStatusUpdate).toHaveBeenCalledWith(
            jasmine.objectContaining({ didJustFinish: true })
          );
          resolve();
        }, 1000);
      });
      await instance.playAsync();
      expect((await instance.getStatusAsync()).isPlaying).toBe(false);
    });
  });

  describe('Video.playFromPositionAsync', () => {
    it('plays a video that played to an end', async () => {
      const onPlaybackStatusUpdate = jasmine.createSpy('onPlaybackStatusUpdate');
      const props = { onPlaybackStatusUpdate, source, style, ref: refSetter };
      await mountAndWaitFor(<Video {...props} />);
      await retryForStatus(instance, { isBuffering: false, isLoaded: true });
      const status = await instance.getStatusAsync();
      await instance.setStatusAsync({
        shouldPlay: true,
        positionMillis: status.durationMillis - 500,
      });
      await new Promise(resolve => {
        setTimeout(() => {
          expect(onPlaybackStatusUpdate).toHaveBeenCalledWith(
            jasmine.objectContaining({ didJustFinish: true })
          );
          resolve();
        }, 1000);
      });
      await instance.playFromPositionAsync(0);
      await retryForStatus(instance, { isPlaying: true });
    });
  });

  describe('Video.replayAsync', () => {
    it('replays the video', async () => {
      await mountAndWaitFor(<Video source={source} ref={refSetter} style={style} shouldPlay />);
      await retryForStatus(instance, { isPlaying: true });
      await waitFor(500);
      const statusBefore = await instance.getStatusAsync();
      await instance.replayAsync();
      await retryForStatus(instance, { isPlaying: true });
      const statusAfter = await instance.getStatusAsync();
      expect(statusAfter.positionMillis).toBeLessThan(statusBefore.positionMillis);
    });

    it('plays a video that played to an end', async () => {
      const onPlaybackStatusUpdate = jasmine.createSpy('onPlaybackStatusUpdate');
      const props = { onPlaybackStatusUpdate, source, style, ref: refSetter };
      await mountAndWaitFor(<Video {...props} />);
      await retryForStatus(instance, { isBuffering: false, isLoaded: true });
      const status = await instance.getStatusAsync();
      await instance.setStatusAsync({
        shouldPlay: true,
        positionMillis: status.durationMillis - 500,
      });
      await new Promise(resolve => {
        setTimeout(() => {
          expect(onPlaybackStatusUpdate).toHaveBeenCalledWith(
            jasmine.objectContaining({ didJustFinish: true })
          );
          resolve();
        }, 1000);
      });
      await instance.replayAsync();
      await retryForStatus(instance, { isPlaying: true });
    });

    /*it('calls the onPlaybackStatusUpdate with hasJustBeenInterrupted = true', async () => {
        const onPlaybackStatusUpdate = jasmine.createSpy('onPlaybackStatusUpdate');
        const props = {
          style,
          source,
          ref: refSetter,
          shouldPlay: true,
          onPlaybackStatusUpdate,
        };
        await mountAndWaitFor(<Video {...props} />);
        await retryForStatus(instance, { isPlaying: true });
        await waitFor(500);
        await instance.replayAsync();
        t
          .expect(onPlaybackStatusUpdate)
          .toHaveBeenCalledWith(jasmine.objectContaining({ hasJustBeenInterrupted: true }));
      });*/
  });

  describe('Video.stopAsync', () => {
    it('stops a playing video', async () => {
      const props = { style, source, shouldPlay: true, ref: refSetter };
      await mountAndWaitFor(<Video {...props} />);
      await retryForStatus(instance, { isPlaying: true });
      await instance.stopAsync();
      await retryForStatus(instance, { isPlaying: false, positionMillis: 0 });
    });

    it('stops a paused video', async () => {
      const props = { style, source, shouldPlay: true, ref: refSetter };
      await mountAndWaitFor(<Video {...props} />);
      await retryForStatus(instance, { isPlaying: true });
      await waitFor(500);
      await instance.pauseAsync();
      await retryForStatus(instance, { isPlaying: false });
      await instance.stopAsync();
      await retryForStatus(instance, { isPlaying: false, positionMillis: 0 });
    });
  });
}
