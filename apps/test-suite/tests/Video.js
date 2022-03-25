'use strict';

import { Asset } from 'expo-asset';
import { Video } from 'expo-av';
import { forEach } from 'lodash';
import React from 'react';
import { Platform } from 'react-native';

import { waitFor, retryForStatus, mountAndWaitFor as originalMountAndWaitFor } from './helpers';

export const name = 'Video';
const imageRemoteSource = { uri: 'http://via.placeholder.com/350x150' };
const videoRemoteSource = { uri: 'http://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4' };
const redirectingVideoRemoteSource = { uri: 'http://bit.ly/2mcW40Q' };
const mp4Source = require('../assets/big_buck_bunny.mp4');
const hlsStreamUri = 'http://qthttp.apple.com.edgesuite.net/1010qwoeiuryfg/sl.m3u8';
const hlsStreamUriWithRedirect = 'http://bit.ly/1iy90bn';
let source = null; // Local URI of the downloaded default source is set in a beforeAll callback.
let portraitVideoSource = null;
let imageSource = null;
let webmSource = null;

const style = { width: 200, height: 200 };

export function test(t, { setPortalChild, cleanupPortal }) {
  t.describe('Video', () => {
    t.beforeAll(async () => {
      const mp4Asset = Asset.fromModule(mp4Source);
      await mp4Asset.downloadAsync();
      source = { uri: mp4Asset.localUri };

      const portraitAsset = Asset.fromModule(require('../assets/portrait_video.mp4'));
      await portraitAsset.downloadAsync();
      portraitVideoSource = { uri: portraitAsset.localUri };

      const imageAsset = Asset.fromModule(require('../assets/black-128x256.png'));
      await imageAsset.downloadAsync();
      imageSource = { uri: imageAsset.localUri };

      const webmAsset = Asset.fromModule(require('../assets/unsupported_bunny.webm'));
      await webmAsset.downloadAsync();
      webmSource = { uri: webmAsset.localUri };
    });

    let instance = null;
    const refSetter = (ref) => {
      instance = ref;
    };

    t.afterEach(async () => {
      instance = null;
      await cleanupPortal();
    });

    const mountAndWaitFor = (child, propName = 'onLoad') =>
      originalMountAndWaitFor(child, propName, setPortalChild);

    const testPropValues = (propName, values, moreTests) =>
      t.describe(`Video.props.${propName}`, () => {
        forEach(values, (value) =>
          t.it(`sets it to \`${value}\``, async () => {
            let instance = null;
            const refSetter = (ref) => {
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
      t.describe(`Video.props.${propName}`, () => {
        forEach(values, (value) =>
          t.it(`setting to \`${value}\` doesn't crash`, async () => {
            const element = React.createElement(Video, { style, source, [propName]: value });
            await mountAndWaitFor(element, 'onLoad');
          })
        );
      });

    const testPropSetter = (propName, propSetter, values, moreTests) =>
      t.describe(`Video.${propSetter}`, () => {
        forEach(values, (value) =>
          t.it(`sets it to \`${value}\``, async () => {
            let instance = null;
            const refSetter = (ref) => {
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
            t.expect(status).toEqual(t.jasmine.objectContaining({ [propName]: value }));
          })
        );

        if (moreTests) {
          moreTests();
        }
      });

    t.describe('Video.props.onLoadStart', () => {
      t.it('gets called when the source starts loading', async () => {
        await mountAndWaitFor(<Video style={style} source={source} />, 'onLoadStart');
      });
    });

    t.describe('Video.props.onLoad', () => {
      t.it('gets called when the source loads', async () => {
        await mountAndWaitFor(<Video style={style} source={source} />, 'onLoad');
      });

      t.it('gets called right when the video starts to play if it should autoplay', async () => {
        const status = await mountAndWaitFor(
          <Video style={style} source={videoRemoteSource} shouldPlay />,
          'onLoad'
        );
        t.expect(status.positionMillis).toEqual(0);
      });
    });

    t.describe('Video.props.source', () => {
      t.it('mounts even when the source is undefined', async () => {
        await mountAndWaitFor(<Video style={style} />, 'ref');
      });

      t.it('loads `require` source', async () => {
        const status = await mountAndWaitFor(<Video style={style} source={mp4Source} />);
        t.expect(status).toEqual(t.jasmine.objectContaining({ isLoaded: true }));
      });

      t.it('loads `Asset` source', async () => {
        const status = await mountAndWaitFor(
          <Video style={style} source={Asset.fromModule(mp4Source)} />
        );
        t.expect(status).toEqual(t.jasmine.objectContaining({ isLoaded: true }));
      });

      t.it('loads `uri` source', async () => {
        const status = await mountAndWaitFor(<Video style={style} source={videoRemoteSource} />);
        t.expect(status).toEqual(t.jasmine.objectContaining({ isLoaded: true }));
      });

      if (Platform.OS === 'android') {
        t.it(
          'calls onError when the file from the Internet redirects to a non-standard content',
          async () => {
            const error = await mountAndWaitFor(
              <Video
                style={style}
                source={{
                  uri: hlsStreamUriWithRedirect,
                }}
              />,
              'onError'
            );
            t.expect(error.toLowerCase()).toContain('none');
          }
        );
        t.it(
          'loads the file from the Internet that redirects to non-standard content when overrideFileExtensionAndroid is provided',
          async () => {
            let hasBeenRejected = false;
            try {
              const status = await mountAndWaitFor(
                <Video
                  style={style}
                  source={{ uri: hlsStreamUriWithRedirect, overrideFileExtensionAndroid: 'm3u8' }}
                />
              );
              t.expect(status).toEqual(t.jasmine.objectContaining({ isLoaded: true }));
            } catch {
              hasBeenRejected = true;
            }
            t.expect(hasBeenRejected).toBe(false);
          }
        );
      } else {
        t.it(
          'loads the file from the Internet that redirects to non-standard content',
          async () => {
            let hasBeenRejected = false;
            try {
              const status = await mountAndWaitFor(
                <Video style={style} source={{ uri: hlsStreamUriWithRedirect }} />
              );
              t.expect(status).toEqual(t.jasmine.objectContaining({ isLoaded: true }));
            } catch {
              hasBeenRejected = true;
            }
            t.expect(hasBeenRejected).toBe(false);
          }
        );
      }

      t.it('loads HLS stream', async () => {
        const status = await mountAndWaitFor(
          <Video style={style} source={{ uri: hlsStreamUri }} />
        );
        t.expect(status).toEqual(t.jasmine.objectContaining({ isLoaded: true }));
      });

      t.it('loads redirecting `uri` source', async () => {
        const status = await mountAndWaitFor(
          <Video style={style} source={redirectingVideoRemoteSource} />
        );
        t.expect(status).toEqual(t.jasmine.objectContaining({ isLoaded: true }));
      });

      t.it('changes the source', async () => {
        await mountAndWaitFor(<Video style={style} source={videoRemoteSource} />);
        await mountAndWaitFor(<Video style={style} source={redirectingVideoRemoteSource} />);
      });

      t.it('changes the source and enables native-controls', async () => {
        await mountAndWaitFor(<Video style={style} source={videoRemoteSource} />);
        await mountAndWaitFor(
          <Video style={style} source={redirectingVideoRemoteSource} useNativeControls />
        );
      });

      t.it('changes the source and disables native-controls', async () => {
        await mountAndWaitFor(<Video style={style} source={videoRemoteSource} useNativeControls />);
        await mountAndWaitFor(<Video style={style} source={redirectingVideoRemoteSource} />);
      });

      // These two are flaky on iOS, sometimes they pass, sometimes they timeout.
      t.it(
        'calls onError when given image source',
        async () => {
          const error = await mountAndWaitFor(
            <Video style={style} source={imageSource} shouldPlay />,
            'onError'
          );
          t.expect(error).toBeDefined();
        },
        30000
      );

      if (Platform.OS === 'ios') {
        t.it(
          'calls onError with a reason when unsupported format given (WebM)',
          async () => {
            const error = await mountAndWaitFor(
              <Video style={style} source={webmSource} shouldPlay />,
              'onError'
            );
            // We cannot check for the specific reason,
            // as sometimes it isn't what we would expect it to be
            // (we'd expect "This media format is not supported."),
            // so let's check whether there is a reason-description separator,
            // which is included only if `localizedFailureReason` is not nil.
            t.expect(error).toContain(' - ');
          },
          30000
        );
      }
    });

    testNoCrash('useNativeControls', [true, false]);
    testNoCrash('usePoster', [true, false]);
    testNoCrash('resizeMode', [
      Video.RESIZE_MODE_COVER,
      Video.RESIZE_MODE_CONTAIN,
      Video.RESIZE_MODE_STRETCH,
    ]);

    t.describe(`Video.props.posterSource`, () => {
      t.it("doesn't crash if is set to required image", async () => {
        const props = {
          style,
          source,
          posterSource: imageSource,
        };
        await mountAndWaitFor(<Video {...props} />);
      });

      t.it("doesn't crash if is set to uri", async () => {
        const props = {
          style,
          source,
          posterSource: imageRemoteSource,
        };
        await mountAndWaitFor(<Video {...props} />);
      });
    });

    t.describe(`Video.props.onReadyForDisplay`, () => {
      t.it('gets called with the `naturalSize` object', async () => {
        const props = {
          style,
          source,
        };
        const status = await mountAndWaitFor(<Video {...props} />, 'onReadyForDisplay');
        t.expect(status.naturalSize).toBeDefined();
        t.expect(status.naturalSize.width).toBeDefined();
        t.expect(status.naturalSize.height).toBeDefined();
        t.expect(status.naturalSize.orientation).toBe('landscape');
      });

      t.it('gets called with the `status` object', async () => {
        const props = {
          style,
          source,
        };
        const status = await mountAndWaitFor(<Video {...props} />, 'onReadyForDisplay');
        t.expect(status.status).toBeDefined();
        t.expect(status.status.isLoaded).toBe(true);
      });

      t.it('gets called when the component uses native controls', async () => {
        const props = {
          style,
          source,
          useNativeControls: true,
        };
        const status = await mountAndWaitFor(<Video {...props} />, 'onReadyForDisplay');
        t.expect(status.status).toBeDefined();
        t.expect(status.status.isLoaded).toBe(true);
      });

      t.it("gets called when the component doesn't use native controls", async () => {
        const props = {
          style,
          source,
          useNativeControls: false,
        };
        const status = await mountAndWaitFor(<Video {...props} />, 'onReadyForDisplay');
        t.expect(status.status).toBeDefined();
        t.expect(status.status.isLoaded).toBe(true);
      });

      t.it('gets called for HLS streams', async () => {
        const props = {
          style,
          source: { uri: hlsStreamUri },
        };
        const status = await mountAndWaitFor(<Video {...props} />, 'onReadyForDisplay');
        t.expect(status.naturalSize).toBeDefined();
        t.expect(status.naturalSize.width).toBeDefined();
        t.expect(status.naturalSize.height).toBeDefined();
        t.expect(status.naturalSize.orientation).toBeDefined();
      });

      t.it('correctly detects portrait video', async () => {
        const props = {
          style,
          source: portraitVideoSource,
        };
        const status = await mountAndWaitFor(<Video {...props} />, 'onReadyForDisplay');
        t.expect(status.naturalSize).toBeDefined();
        t.expect(status.naturalSize.width).toBeDefined();
        t.expect(status.naturalSize.height).toBeDefined();
        t.expect(status.naturalSize.orientation).toBe('portrait');
      });
    });

    t.describe('Video fullscreen player', () => {
      t.it('presents the player and calls callback func', async () => {
        const fullscreenUpdates = [];
        const onFullscreenUpdate = (event) => fullscreenUpdates.push(event.fullscreenUpdate);

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

        t.expect(fullscreenUpdates).toEqual([
          Video.FULLSCREEN_UPDATE_PLAYER_WILL_PRESENT,
          Video.FULLSCREEN_UPDATE_PLAYER_DID_PRESENT,
        ]);

        await instance.dismissFullscreenPlayer();
        await waitFor(1000);

        t.expect(fullscreenUpdates).toEqual([
          Video.FULLSCREEN_UPDATE_PLAYER_WILL_PRESENT,
          Video.FULLSCREEN_UPDATE_PLAYER_DID_PRESENT,
          Video.FULLSCREEN_UPDATE_PLAYER_WILL_DISMISS,
          Video.FULLSCREEN_UPDATE_PLAYER_DID_DISMISS,
        ]);
      });

      if (Platform.OS === 'android') {
        t.it("raises an error if the code didn't wait for completion", async () => {
          let presentationError = null;
          let dismissalError = null;
          try {
            await mountAndWaitFor(
              <Video style={style} source={source} ref={refSetter} />,
              'onReadyForDisplay'
            );
            instance.presentFullscreenPlayer().catch((error) => {
              presentationError = error;
            });
            await instance.dismissFullscreenPlayer();
          } catch (error) {
            dismissalError = error;
          }

          t.expect(presentationError).toBeDefined();
          t.expect(dismissalError).toBeDefined();
        });
      }

      t.it('rejects dismissal request if present request is being handled', async () => {
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
        t.expect(error).toBeDefined();
        await presentationPromise;
        await instance.dismissFullscreenPlayer();
      });

      t.it('rejects presentation request if present request is already being handled', async () => {
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
        t.expect(error).toBeDefined();
        await presentationPromise;
        await instance.dismissFullscreenPlayer();
      });

      // NOTE(2018-10-17): Some of these tests are failing on iOS
      const unreliablyIt = Platform.OS === 'ios' ? t.xit : t.it;

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
            t.expect(firstErrored).toBe(true);
            // t.expect(secondErrored).toBe(true);
            t.expect(thirdErrored).toBe(false);
          }
          const pleaseDismiss = async () => {
            try {
              await instance.dismissFullscreenPlayer();
            } catch {
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
      t.it('errors when trying to set it to 2', async () => {
        let error = null;
        try {
          const props = { style, source, ref: refSetter };
          await mountAndWaitFor(<Video {...props} />);
          await instance.setVolumeAsync(2);
        } catch (err) {
          error = err;
        }
        t.expect(error).toBeDefined();
        t.expect(error.toString()).toMatch(/value .+ between/);
      });

      t.it('errors when trying to set it to -0.5', async () => {
        let error = null;
        try {
          const props = { style, source, ref: refSetter };
          await mountAndWaitFor(<Video {...props} />);
          await instance.setVolumeAsync(-0.5);
        } catch (err) {
          error = err;
        }
        t.expect(error).toBeDefined();
        t.expect(error.toString()).toMatch(/value .+ between/);
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
      t.it('errors when trying to set it above 32', async () => {
        let error = null;
        try {
          const props = { style, source, ref: refSetter };
          await mountAndWaitFor(<Video {...props} />);
          await instance.setRateAsync(34);
        } catch (err) {
          error = err;
        }
        t.expect(error).toBeDefined();
        t.expect(error.toString()).toMatch(/value .+ between/);
      });

      t.it('errors when trying to set it under 0', async () => {
        let error = null;
        try {
          const props = { style, source, ref: refSetter };
          await mountAndWaitFor(<Video {...props} />);
          await instance.setRateAsync(-0.5);
        } catch (err) {
          error = err;
        }
        t.expect(error).toBeDefined();
        t.expect(error.toString()).toMatch(/value .+ between/);
      });
    });

    testPropValues('shouldPlay', [true, false]);
    testPropValues('shouldCorrectPitch', [true, false]);

    t.describe('Video.onPlaybackStatusUpdate', () => {
      t.it('gets called with `didJustFinish = true` when video is done playing', async () => {
        const onPlaybackStatusUpdate = t.jasmine.createSpy('onPlaybackStatusUpdate');
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
        await new Promise((resolve) => {
          setTimeout(() => {
            t.expect(onPlaybackStatusUpdate).toHaveBeenCalledWith(
              t.jasmine.objectContaining({ didJustFinish: true })
            );
            resolve();
          }, 1000);
        });
      });

      t.it('gets called periodically when playing', async () => {
        const onPlaybackStatusUpdate = t.jasmine.createSpy('onPlaybackStatusUpdate');
        const props = {
          onPlaybackStatusUpdate,
          source,
          style,
          ref: refSetter,
          progressUpdateIntervalMillis: 10,
        };
        await mountAndWaitFor(<Video {...props} />);
        await new Promise((resolve) => setTimeout(resolve, 100));
        await retryForStatus(instance, { isBuffering: false, isLoaded: true });
        // Verify that status-update doesn't get called periodically when not started
        const beforeCount = onPlaybackStatusUpdate.calls.count();
        t.expect(beforeCount).toBeLessThan(6);

        const status = await instance.getStatusAsync();
        await instance.setStatusAsync({
          shouldPlay: true,
          positionMillis: status.durationMillis - 500,
        });
        await retryForStatus(instance, { isPlaying: true });
        await new Promise((resolve) => setTimeout(resolve, 500));
        await retryForStatus(instance, { isPlaying: false });
        const duringCount = onPlaybackStatusUpdate.calls.count() - beforeCount;
        t.expect(duringCount).toBeGreaterThan(50);

        // Wait a bit longer and verify it doesn't get called anymore
        await new Promise((resolve) => setTimeout(resolve, 100));
        const afterCount = onPlaybackStatusUpdate.calls.count() - beforeCount - duringCount;
        t.expect(afterCount).toBeLessThan(3);
      });
    });

    /*t.describe('Video.setProgressUpdateIntervalAsync', () => {
      t.it('sets frequence of the progress updates', async () => {
        const onPlaybackStatusUpdate = t.jasmine.createSpy('onPlaybackStatusUpdate');
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
            t.expect(onPlaybackStatusUpdate.calls.count()).toBeGreaterThan(expectedArgsCount);

            const realMillis = map(
              takeRight(filter(flatten(onPlaybackStatusUpdate.calls.allArgs()), 'isPlaying'), 4),
              'positionMillis'
            );

            for (let i = 3; i > 0; i--) {
              const difference = Math.abs(realMillis[i] - realMillis[i - 1] - updateInterval);
              t.expect(difference).toBeLessThan(updateInterval / 2 + 1);
            }

            resolve();
          }, 1500);
        });
      });
    });*/

    t.describe('Video.setPositionAsync', () => {
      t.it('sets position of the video', async () => {
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

    t.describe('Video.loadAsync', () => {
      // NOTE(2018-03-08): Some of these tests are failing on iOS
      const unreliablyIt = Platform.OS === 'ios' ? t.xit : t.it;
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
        t.expect(status.positionMillis).toBeLessThan(1100);
        t.expect(status.positionMillis).toBeGreaterThan(900);
      });

      unreliablyIt('keeps the video instance after load when using poster', async () => {
        const instance = await mountAndWaitFor(<Video style={style} usePoster />, 'ref');
        await instance.loadAsync(source, { shouldPlay: true });
        await waitFor(500);
        await retryForStatus(instance, { isPlaying: true });
      });
    });

    t.describe('Video.unloadAsync', () => {
      t.it('unloads the video', async () => {
        const props = { style, source, ref: refSetter };
        await mountAndWaitFor(<Video {...props} />);
        await retryForStatus(instance, { isLoaded: true });
        await instance.unloadAsync();
        await retryForStatus(instance, { isLoaded: false });
      });
    });

    t.describe('Video.pauseAsync', () => {
      t.it('pauses the video', async () => {
        const props = { style, source, shouldPlay: true, ref: refSetter };
        await mountAndWaitFor(<Video {...props} />);
        await retryForStatus(instance, { isPlaying: true });
        await new Promise((r) => setTimeout(r, 500));
        await instance.pauseAsync();
        await retryForStatus(instance, { isPlaying: false });
        const { positionMillis } = await instance.getStatusAsync();
        t.expect(positionMillis).toBeGreaterThan(0);
      });
    });

    t.describe('Video.playAsync', () => {
      // NOTE(2018-03-08): Some of these tests are failing on iOS
      const unreliablyIt = Platform.OS === 'ios' ? t.xit : t.it;

      t.it('plays the stopped video', async () => {
        const props = { style, source, ref: refSetter };
        await mountAndWaitFor(<Video {...props} />);
        await retryForStatus(instance, { isLoaded: true });
        await instance.playAsync();
        await retryForStatus(instance, { isPlaying: true });
      });

      t.it('plays the paused video', async () => {
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
        const onPlaybackStatusUpdate = t.jasmine.createSpy('onPlaybackStatusUpdate');
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
        await new Promise((resolve) => {
          setTimeout(() => {
            t.expect(onPlaybackStatusUpdate).toHaveBeenCalledWith(
              t.jasmine.objectContaining({ didJustFinish: true })
            );
            resolve();
          }, 1000);
        });
        await instance.playAsync();
        t.expect((await instance.getStatusAsync()).isPlaying).toBe(false);
      });
    });

    t.describe('Video.playFromPositionAsync', () => {
      t.it('plays a video that played to an end', async () => {
        const onPlaybackStatusUpdate = t.jasmine.createSpy('onPlaybackStatusUpdate');
        const props = { onPlaybackStatusUpdate, source, style, ref: refSetter };
        await mountAndWaitFor(<Video {...props} />);
        await retryForStatus(instance, { isBuffering: false, isLoaded: true });
        const status = await instance.getStatusAsync();
        await instance.setStatusAsync({
          shouldPlay: true,
          positionMillis: status.durationMillis - 500,
        });
        await new Promise((resolve) => {
          setTimeout(() => {
            t.expect(onPlaybackStatusUpdate).toHaveBeenCalledWith(
              t.jasmine.objectContaining({ didJustFinish: true })
            );
            resolve();
          }, 1000);
        });
        await instance.playFromPositionAsync(0);
        await retryForStatus(instance, { isPlaying: true });
      });
    });

    t.describe('Video.replayAsync', () => {
      t.it('replays the video', async () => {
        await mountAndWaitFor(<Video source={source} ref={refSetter} style={style} shouldPlay />);
        await retryForStatus(instance, { isPlaying: true });
        await waitFor(500);
        const statusBefore = await instance.getStatusAsync();
        await instance.replayAsync();
        await retryForStatus(instance, { isPlaying: true });
        const statusAfter = await instance.getStatusAsync();
        t.expect(statusAfter.positionMillis).toBeLessThan(statusBefore.positionMillis);
      });

      t.it('plays a video that played to an end', async () => {
        const onPlaybackStatusUpdate = t.jasmine.createSpy('onPlaybackStatusUpdate');
        const props = { onPlaybackStatusUpdate, source, style, ref: refSetter };
        await mountAndWaitFor(<Video {...props} />);
        await retryForStatus(instance, { isBuffering: false, isLoaded: true });
        const status = await instance.getStatusAsync();
        await instance.setStatusAsync({
          shouldPlay: true,
          positionMillis: status.durationMillis - 500,
        });
        await new Promise((resolve) => {
          setTimeout(() => {
            t.expect(onPlaybackStatusUpdate).toHaveBeenCalledWith(
              t.jasmine.objectContaining({ didJustFinish: true })
            );
            resolve();
          }, 1000);
        });
        await instance.replayAsync();
        await retryForStatus(instance, { isPlaying: true });
      });

      /*t.it('calls the onPlaybackStatusUpdate with hasJustBeenInterrupted = true', async () => {
        const onPlaybackStatusUpdate = t.jasmine.createSpy('onPlaybackStatusUpdate');
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
          .toHaveBeenCalledWith(t.jasmine.objectContaining({ hasJustBeenInterrupted: true }));
      });*/
    });

    t.describe('Video.stopAsync', () => {
      let originalTimeout;

      t.beforeAll(async () => {
        originalTimeout = t.jasmine.DEFAULT_TIMEOUT_INTERVAL;
        t.jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout * 6;
      });

      t.afterAll(() => {
        t.jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
      });

      t.it('stops a playing video', async () => {
        const props = { style, source, shouldPlay: true, ref: refSetter };
        await mountAndWaitFor(<Video {...props} />);
        await retryForStatus(instance, { isPlaying: true });
        await instance.stopAsync();
        await retryForStatus(instance, { isPlaying: false, positionMillis: 0 });
      });

      t.it('stops a paused video', async () => {
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
  });
}
