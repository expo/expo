'use strict';

import React from 'react';
import { Platform } from 'react-native';
import { Camera, Permissions, Video } from 'expo';
import * as TestUtils from '../TestUtils';

import { waitFor, mountAndWaitFor as originalMountAndWaitFor, retryForStatus } from './helpers';

export const name = 'Camera';
const style = { width: 200, height: 200 };

export async function test(t, { setPortalChild, cleanupPortal }) {
  const shouldSkipTestsRequiringPermissions = await TestUtils.shouldSkipTestsRequiringPermissionsAsync();
  const describeWithPermissions = shouldSkipTestsRequiringPermissions ? t.xdescribe : t.describe;

  describeWithPermissions('Camera', () => {
    let instance = null;
    let originalTimeout;

    const refSetter = ref => {
      instance = ref;
    };

    const mountAndWaitFor = (child, propName = 'onCameraReady') =>
      new Promise(resolve => {
        const response = originalMountAndWaitFor(child, propName, setPortalChild);
        setTimeout(() => resolve(response), 1500);
      });

    t.beforeAll(async () => {
      await TestUtils.acceptPermissionsAndRunCommandAsync(() => {
        return Permissions.askAsync(Permissions.CAMERA);
      });
      await TestUtils.acceptPermissionsAndRunCommandAsync(() => {
        return Permissions.askAsync(Permissions.AUDIO_RECORDING);
      });

      originalTimeout = t.jasmine.DEFAULT_TIMEOUT_INTERVAL;
      t.jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout * 3;
    });

    t.afterAll(() => {
      t.jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
    });

    t.beforeEach(async () => {
      const { status } = await Permissions.getAsync(Permissions.CAMERA);
      t.expect(status).toEqual('granted');
    });

    t.afterEach(async () => {
      instance = null;
      await cleanupPortal();
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

    t.describe('Camera.takePictureAsync', () => {
      t.it('returns a local URI', async () => {
        await mountAndWaitFor(<Camera ref={refSetter} style={style} />);
        const picture = await instance.takePictureAsync();
        t.expect(picture).toBeDefined();
        t.expect(picture.uri).toMatch(/^file:\/\//);
      });

      t.it('returns `width` and `height` of the image', async () => {
        await mountAndWaitFor(<Camera ref={refSetter} style={style} />);
        let picture = await instance.takePictureAsync();
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

      t.it('returns Base64 only if requested', async () => {
        await mountAndWaitFor(<Camera ref={refSetter} style={style} />);
        let picture = await instance.takePictureAsync({ base64: false });
        t.expect(picture).toBeDefined();
        t.expect(picture.base64).not.toBeDefined();

        picture = await instance.takePictureAsync({ base64: true });
        t.expect(picture).toBeDefined();
        t.expect(picture.base64).toBeDefined();
      });

      t.it('returns proper `exif.Flash % 2 = 0` if the flash is off', async () => {
        await mountAndWaitFor(
          <Camera ref={refSetter} flashMode={Camera.Constants.FlashMode.off} style={style} />
        );
        let picture = await instance.takePictureAsync({ exif: true });
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
          let picture = await instance.takePictureAsync({ exif: true });
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
        let picture = await instance.takePictureAsync({ exif: true });
        t.expect(picture).toBeDefined();
        t.expect(picture.exif).toBeDefined();
        t.expect(picture.exif.WhiteBalance).toEqual(1);
      });

      t.it('returns `exif.WhiteBalance = 0` if white balance is set to auto', async () => {
        await mountAndWaitFor(
          <Camera style={style} ref={refSetter} whiteBalance={Camera.Constants.WhiteBalance.auto} />
        );
        let picture = await instance.takePictureAsync({ exif: true });
        t.expect(picture).toBeDefined();
        t.expect(picture.exif).toBeDefined();
        t.expect(picture.exif.WhiteBalance).toEqual(0);
      });

      if (Platform.OS === 'ios') {
        t.it('returns `exif.LensModel ~= back` if camera type is set to back', async () => {
          await mountAndWaitFor(
            <Camera style={style} ref={refSetter} type={Camera.Constants.Type.back} />
          );
          let picture = await instance.takePictureAsync({ exif: true });
          t.expect(picture).toBeDefined();
          t.expect(picture.exif).toBeDefined();
          t.expect(picture.exif.LensModel).toMatch('back');
        });

        t.it('returns `exif.LensModel ~= front` if camera type is set to front', async () => {
          await mountAndWaitFor(
            <Camera style={style} ref={refSetter} type={Camera.Constants.Type.front} />
          );
          let picture = await instance.takePictureAsync({ exif: true });
          t.expect(picture).toBeDefined();
          t.expect(picture.exif).toBeDefined();
          t.expect(picture.exif.LensModel).toMatch('front');
        });

        t.it('returns `exif.DigitalZoom ~= false` if zoom is not set', async () => {
          await mountAndWaitFor(<Camera style={style} ref={refSetter} />);
          let picture = await instance.takePictureAsync({ exif: true });
          t.expect(picture).toBeDefined();
          t.expect(picture.exif).toBeDefined();
          t.expect(picture.exif.DigitalZoomRatio).toBeFalsy();
        });

        t.it('returns `exif.DigitalZoom ~= false` if zoom is set to 0', async () => {
          await mountAndWaitFor(<Camera style={style} ref={refSetter} zoom={0} />);
          let picture = await instance.takePictureAsync({ exif: true });
          t.expect(picture).toBeDefined();
          t.expect(picture.exif).toBeDefined();
          t.expect(picture.exif.DigitalZoomRatio).toBeFalsy();
        });

        let smallerRatio = null;

        t.it('returns `exif.DigitalZoom > 0` if zoom is set', async () => {
          await mountAndWaitFor(<Camera style={style} ref={refSetter} zoom={0.5} />);
          let picture = await instance.takePictureAsync({ exif: true });
          t.expect(picture).toBeDefined();
          t.expect(picture.exif).toBeDefined();
          t.expect(picture.exif.DigitalZoomRatio).toBeGreaterThan(0);
          smallerRatio = picture.exif.DigitalZoomRatio;
        });

        t.it(
          'returns `exif.DigitalZoom`s monotonically increasing with the zoom value',
          async () => {
            await mountAndWaitFor(<Camera style={style} ref={refSetter} zoom={1} />);
            let picture = await instance.takePictureAsync({ exif: true });
            t.expect(picture).toBeDefined();
            t.expect(picture.exif).toBeDefined();
            t.expect(picture.exif.DigitalZoomRatio).toBeGreaterThan(smallerRatio);
          }
        );
      }
    });

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
        instance.stopRecording();
        const response = await recordingPromise;
        t.expect(response).toBeDefined();
        t.expect(response.uri).toMatch(/^file:\/\//);
      });

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
      const testFrontCameraRecording = async camera => {
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

          const recordFor = duration =>
            new Promise(async (resolve, reject) => {
              const recordingPromise = instance.recordAsync();
              await waitFor(duration);
              instance.stopRecording();
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

          const recordFor = duration =>
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
