import { Video } from 'expo-av';
import { Camera } from 'expo-camera';
import React from 'react';
import { Platform } from 'react-native';

import { waitFor, mountAndWaitFor as originalMountAndWaitFor, retryForStatus } from './helpers';
import * as TestUtils from '../TestUtils';

export const name = 'Camera';
const style = { width: 200, height: 200 };

export async function test(t, { setPortalChild, cleanupPortal }) {
  const shouldSkipTestsRequiringPermissions =
    await TestUtils.shouldSkipTestsRequiringPermissionsAsync();
  const describeWithPermissions = shouldSkipTestsRequiringPermissions ? t.xdescribe : t.describe;

  describeWithPermissions('Camera', () => {
    let instance = null;
    let originalTimeout;

    const refSetter = (ref) => {
      instance = ref;
    };

    const mountAndWaitFor = async (child, propName = 'onCameraReady') =>
      await originalMountAndWaitFor(child, propName, setPortalChild);

    t.beforeAll(async () => {
      await TestUtils.acceptPermissionsAndRunCommandAsync(() => {
        return Camera.requestCameraPermissionsAsync();
      });
      await TestUtils.acceptPermissionsAndRunCommandAsync(() => {
        return Camera.requestMicrophonePermissionsAsync();
      });

      originalTimeout = t.jasmine.DEFAULT_TIMEOUT_INTERVAL;
      t.jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout * 3;
    });

    t.afterAll(() => {
      t.jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
    });

    t.beforeEach(async () => {
      const { status } = await Camera.getCameraPermissionsAsync();
      t.expect(status).toEqual('granted');
    });

    t.afterEach(async () => {
      instance = null;
      await cleanupPortal();
    });

    t.describe('Camera.getCameraPermissionsAsync', () => {
      t.it('is granted', async () => {
        const { status } = await Camera.getCameraPermissionsAsync();
        t.expect(status).toEqual('granted');
      });
    });

    t.describe('Camera.getMicrophonePermissionsAsync', () => {
      t.it('is granted', async () => {
        const { status } = await Camera.getMicrophonePermissionsAsync();
        t.expect(status).toEqual('granted');
      });
    });

    if (Platform.OS === 'android') {
      t.describe('Camera.getSupportedRatiosAsync', () => {
        t.it('returns an array of strings', async () => {
          await mountAndWaitFor(<Camera style={style} ref={refSetter} />);
          const ratios = await instance.getSupportedRatiosAsync();
          t.expect(ratios instanceof Array).toBe(true);
          t.expect(ratios.length).toBeGreaterThan(0);
        });
      });
    }

    // NOTE(2020-06-03): These tests are very flaky on Android so we're disabling them for now
    if (Platform.OS !== 'android') {
      t.describe('Camera.takePictureAsync', () => {
        t.it('returns a local URI', async () => {
          await mountAndWaitFor(<Camera ref={refSetter} style={style} />);
          const picture = await instance.takePictureAsync();
          t.expect(picture).toBeDefined();
          t.expect(picture.uri).toMatch(/^file:\/\//);
        });

        t.it('returns `width` and `height` of the image', async () => {
          await mountAndWaitFor(<Camera ref={refSetter} style={style} />);
          const picture = await instance.takePictureAsync();
          t.expect(picture).toBeDefined();
          t.expect(picture.width).toBeDefined();
          t.expect(picture.height).toBeDefined();
        });

        t.it('returns EXIF only if requested', async () => {
          await mountAndWaitFor(<Camera ref={refSetter} style={style} />);
          let picture = await instance.takePictureAsync({ exif: false });
          t.expect(picture).toBeDefined();
          t.expect(picture.exif).not.toBeDefined();

          picture = await instance.takePictureAsync({ exif: true });
          t.expect(picture).toBeDefined();
          t.expect(picture.exif).toBeDefined();
        });

        t.it('adds additional EXIF only if requested', async () => {
          await mountAndWaitFor(<Camera ref={refSetter} style={style} />);
          const additionalExif = {
            GPSLatitude: 30.82123,
            GPSLongitude: 150.25582,
            GPSAltitude: 80.808,
          };
          let picture = await instance.takePictureAsync({ exif: false, additionalExif });
          t.expect(picture).toBeDefined();
          t.expect(picture.exif).not.toBeDefined();

          picture = await instance.takePictureAsync({ exif: true, additionalExif });
          t.expect(picture).toBeDefined();
          t.expect(picture.exif).toBeDefined();
          t.expect(picture.exif.GPSLatitude).toBe(additionalExif.GPSLatitude);
          t.expect(picture.exif.GPSLongitude).toBe(additionalExif.GPSLongitude);
          t.expect(picture.exif.GPSAltitude).toBe(additionalExif.GPSAltitude);
        });

        t.it(
          `returns Base64 only if requested, and not contains newline and
          special characters (\n or \r)`,
          async () => {
            await mountAndWaitFor(<Camera ref={refSetter} style={style} />);
            let picture = await instance.takePictureAsync({ base64: false });
            t.expect(picture).toBeDefined();
            t.expect(picture.base64).not.toBeDefined();

            picture = await instance.takePictureAsync({ base64: true });
            t.expect(picture).toBeDefined();
            t.expect(picture.base64).toBeDefined();
            t.expect(picture.base64).not.toContain('\n');
            t.expect(picture.base64).not.toContain('\r');
          }
        );

        t.it('returns proper `exif.Flash % 2 = 0` if the flash is off', async () => {
          await mountAndWaitFor(
            <Camera ref={refSetter} flashMode={Camera.Constants.FlashMode.off} style={style} />
          );
          const picture = await instance.takePictureAsync({ exif: true });
          t.expect(picture).toBeDefined();
          t.expect(picture.exif).toBeDefined();
          t.expect(picture.exif.Flash % 2 === 0).toBe(true);
        });

        if (Platform.OS === 'ios') {
          // https://www.awaresystems.be/imaging/tiff/tifftags/privateifd/exif/flash.html
          // Android returns invalid values! (I've tested the code on an Android tablet
          // that has no flash and it returns Flash = 0, meaning that the flash did not fire,
          // but is present.)

          t.it('returns proper `exif.Flash % 2 = 1` if the flash is on', async () => {
            await mountAndWaitFor(
              <Camera ref={refSetter} flashMode={Camera.Constants.FlashMode.on} style={style} />
            );
            const picture = await instance.takePictureAsync({ exif: true });
            t.expect(picture).toBeDefined();
            t.expect(picture.exif).toBeDefined();
            t.expect(picture.exif.Flash % 2 === 1).toBe(true);
          });
        }

        // https://www.awaresystems.be/imaging/tiff/tifftags/privateifd/exif/whitebalance.html

        t.it('returns `exif.WhiteBalance = 1` if white balance is manually set', async () => {
          await mountAndWaitFor(
            <Camera
              style={style}
              ref={refSetter}
              whiteBalance={Camera.Constants.WhiteBalance.incandescent}
            />
          );
          const picture = await instance.takePictureAsync({ exif: true });
          t.expect(picture).toBeDefined();
          t.expect(picture.exif).toBeDefined();
          t.expect(picture.exif.WhiteBalance).toEqual(1);
        });

        t.it('returns `exif.WhiteBalance = 0` if white balance is set to auto', async () => {
          await mountAndWaitFor(
            <Camera
              style={style}
              ref={refSetter}
              whiteBalance={Camera.Constants.WhiteBalance.auto}
            />
          );
          const picture = await instance.takePictureAsync({ exif: true });
          t.expect(picture).toBeDefined();
          t.expect(picture.exif).toBeDefined();
          t.expect(picture.exif.WhiteBalance).toEqual(0);
        });

        if (Platform.OS === 'ios') {
          t.it('returns `exif.LensModel ~= back` if camera type is set to back', async () => {
            await mountAndWaitFor(
              <Camera style={style} ref={refSetter} type={Camera.Constants.Type.back} />
            );
            const picture = await instance.takePictureAsync({ exif: true });
            t.expect(picture).toBeDefined();
            t.expect(picture.exif).toBeDefined();
            t.expect(picture.exif.LensModel).toMatch('back');
            await cleanupPortal();
          });

          t.it('returns `exif.LensModel ~= front` if camera type is set to front', async () => {
            await mountAndWaitFor(
              <Camera style={style} ref={refSetter} type={Camera.Constants.Type.front} />
            );
            const picture = await instance.takePictureAsync({ exif: true });
            t.expect(picture).toBeDefined();
            t.expect(picture.exif).toBeDefined();
            t.expect(picture.exif.LensModel).toMatch('front');
            await cleanupPortal();
          });

          t.it('returns `exif.DigitalZoom ~= false` if zoom is not set', async () => {
            await mountAndWaitFor(<Camera style={style} ref={refSetter} />);
            const picture = await instance.takePictureAsync({ exif: true });
            t.expect(picture).toBeDefined();
            t.expect(picture.exif).toBeDefined();
            t.expect(picture.exif.DigitalZoomRatio).toBeFalsy();
            await cleanupPortal();
          });

          t.it('returns `exif.DigitalZoom ~= false` if zoom is set to 0', async () => {
            await mountAndWaitFor(<Camera style={style} ref={refSetter} zoom={0} />);
            const picture = await instance.takePictureAsync({ exif: true });
            t.expect(picture).toBeDefined();
            t.expect(picture.exif).toBeDefined();
            t.expect(picture.exif.DigitalZoomRatio).toBeFalsy();
            await cleanupPortal();
          });

          let smallerRatio = null;

          t.it('returns `exif.DigitalZoom > 0` if zoom is set', async () => {
            await mountAndWaitFor(<Camera style={style} ref={refSetter} zoom={0.5} />);
            const picture = await instance.takePictureAsync({ exif: true });
            t.expect(picture).toBeDefined();
            t.expect(picture.exif).toBeDefined();
            t.expect(picture.exif.DigitalZoomRatio).toBeGreaterThan(0);
            smallerRatio = picture.exif.DigitalZoomRatio;
            await cleanupPortal();
          });

          t.it(
            'returns `exif.DigitalZoom`s monotonically increasing with the zoom value',
            async () => {
              await mountAndWaitFor(<Camera style={style} ref={refSetter} zoom={1} />);
              const picture = await instance.takePictureAsync({ exif: true });
              t.expect(picture).toBeDefined();
              t.expect(picture.exif).toBeDefined();
              t.expect(picture.exif.DigitalZoomRatio).toBeGreaterThan(smallerRatio);
              await cleanupPortal();
            }
          );
        }
      });
    }

    t.describe('Camera.recordAsync', () => {
      t.beforeEach(async () => {
        if (Platform.OS === 'ios') {
          await waitFor(500);
        }
      });

      t.it('returns a local URI', async () => {
        await mountAndWaitFor(<Camera ref={refSetter} style={style} />);
        const recordingPromise = instance.recordAsync();
        await waitFor(2500);
        await instance.stopRecording();
        const response = await recordingPromise;
        t.expect(response).toBeDefined();
        t.expect(response.uri).toMatch(/^file:\/\//);
      });

      if (Platform.OS === 'ios') {
        t.it('throws for an unavailable codec', async () => {
          await mountAndWaitFor(<Camera ref={refSetter} style={style} />);

          await instance
            .recordAsync({
              codec: '123',
            })
            .catch((error) => {
              t.expect(error.message).toMatch(/'123' is not present in VideoCodec enum/i);
            });
        });

        t.it('returns available codecs', async () => {
          const codecs = await Camera.getAvailableVideoCodecsAsync();
          t.expect(codecs).toBeDefined();
          t.expect(codecs.length).toBeGreaterThan(0);
        });
      }

      let recordedFileUri = null;

      t.it('stops the recording after maxDuration', async () => {
        await mountAndWaitFor(<Camera ref={refSetter} style={style} />);
        const response = await instance.recordAsync({ maxDuration: 2 });
        recordedFileUri = response.uri;
      });

      t.it('the video has a duration near maxDuration', async () => {
        await mountAndWaitFor(
          <Video style={style} source={{ uri: recordedFileUri }} ref={refSetter} />,
          'onLoad'
        );
        await retryForStatus(instance, { isBuffering: false });
        const video = await instance.getStatusAsync();
        t.expect(video.durationMillis).toBeLessThan(2250);
        t.expect(video.durationMillis).toBeGreaterThan(1750);
      });

      // Test for the fix to: https://github.com/expo/expo/issues/1976
      const testFrontCameraRecording = async (camera) => {
        await mountAndWaitFor(camera);
        const response = await instance.recordAsync({ maxDuration: 2 });

        await mountAndWaitFor(
          <Video style={style} source={{ uri: response.uri }} ref={refSetter} />,
          'onLoad'
        );
        await retryForStatus(instance, { isBuffering: false });
        const video = await instance.getStatusAsync();

        t.expect(video.durationMillis).toBeLessThan(2250);
        t.expect(video.durationMillis).toBeGreaterThan(1750);
      };

      t.it('records using the front camera', async () => {
        await testFrontCameraRecording(
          <Camera
            ref={refSetter}
            style={style}
            type={Camera.Constants.Type.front}
            useCamera2Api={false}
          />
        );
      });

      if (Platform.OS === 'android') {
        t.it('records using the front camera and Camera2 API', async () => {
          await testFrontCameraRecording(
            <Camera
              ref={refSetter}
              style={style}
              type={Camera.Constants.Type.front}
              useCamera2Api
            />
          );
        });
      }

      t.it('stops the recording after maxFileSize', async () => {
        await mountAndWaitFor(<Camera ref={refSetter} style={style} />);
        await instance.recordAsync({ maxFileSize: 256 * 1024 }); // 256 KiB
      });

      t.describe('can record consecutive clips', () => {
        let defaultTimeoutInterval = null;
        t.beforeAll(() => {
          defaultTimeoutInterval = t.jasmine.DEFAULT_TIMEOUT_INTERVAL;
          t.jasmine.DEFAULT_TIMEOUT_INTERVAL = defaultTimeoutInterval * 2;
        });

        t.afterAll(() => {
          t.jasmine.DEFAULT_TIMEOUT_INTERVAL = defaultTimeoutInterval;
        });

        t.it('started/stopped manually', async () => {
          await mountAndWaitFor(<Camera style={style} ref={refSetter} />);

          const recordFor = (duration) =>
            new Promise(async (resolve, reject) => {
              const recordingPromise = instance.recordAsync();
              await waitFor(duration);
              await instance.stopRecording();
              try {
                const recordedVideo = await recordingPromise;
                t.expect(recordedVideo).toBeDefined();
                t.expect(recordedVideo.uri).toBeDefined();
                resolve();
              } catch (error) {
                reject(error);
              }
            });

          await recordFor(1000);
          await waitFor(1000);
          await recordFor(1000);
        });

        t.it('started/stopped automatically', async () => {
          await mountAndWaitFor(<Camera style={style} ref={refSetter} />);

          const recordFor = (duration) =>
            new Promise(async (resolve, reject) => {
              try {
                const response = await instance.recordAsync({ maxDuration: duration / 1000 });
                resolve(response);
              } catch (error) {
                reject(error);
              }
            });

          await recordFor(1000);
          await recordFor(1000);
        });
      });
    });
  });
}
