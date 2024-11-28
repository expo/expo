import { isDevice } from 'expo-device';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

import { alertAndWaitForResponse } from './helpers';
import * as TestUtils from '../TestUtils';
import { isDeviceFarm } from '../utils/Environment';

export const name = 'ImagePicker';

export async function test({ it, beforeAll, expect, jasmine, describe, afterAll }) {
  function testMediaObjectShape(shape, type) {
    expect(shape).toBeDefined();

    expect(typeof shape.uri).toBe('string');
    expect(typeof shape.width).toBe('number');
    expect(typeof shape.height).toBe('number');
    expect(typeof shape.type).toBe('string');

    expect(shape.uri).not.toBe('');
    expect(shape.width).toBeGreaterThan(0);
    expect(shape.height).toBeGreaterThan(0);

    expect(typeof shape.type).toBe('string');

    if (type) {
      expect(shape.type).toBe(type);
    }

    if (shape.type === 'video') {
      expect(typeof shape.duration).toBe('number');
      expect(shape.duration).toBeGreaterThan(0);
    }
  }
  function testResultShape(result, type) {
    expect(result.canceled).toBe(false);

    for (const asset of result.assets) {
      testMediaObjectShape(asset, type);
    }
  }

  describe(name, () => {
    if (isDeviceFarm()) return;

    let originalTimeout;

    beforeAll(async () => {
      await TestUtils.acceptPermissionsAndRunCommandAsync(() => {
        return ImagePicker.requestMediaLibraryPermissionsAsync();
      });
      await TestUtils.acceptPermissionsAndRunCommandAsync(() => {
        return ImagePicker.requestCameraPermissionsAsync();
      });
      originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
      jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout * 10;
    });

    describe('launchCameraAsync', () => {
      if (isDevice) {
        it('launches the camera', async () => {
          await alertAndWaitForResponse('Please take a picture for this test to pass.');
          const result = await ImagePicker.launchCameraAsync();

          testResultShape(result);
        });

        it('cancels the camera', async () => {
          await alertAndWaitForResponse('Please cancel the camera for this test to pass.');
          const result = await ImagePicker.launchCameraAsync();
          expect(result.canceled).toBe(true);
          expect(result.assets).toBe(null);
        });
      } else {
        it('natively prevents the camera from launching on a simulator', async () => {
          let err;
          try {
            await ImagePicker.launchCameraAsync();
          } catch ({ code }) {
            err = code;
          }
          expect(err).toBe('ERR_CAMERA_UNAVAILABLE_ON_SIMULATOR');
        });
      }
    });

    describe('launchImageLibraryAsync', async () => {
      it('mediaType: image', async () => {
        await alertAndWaitForResponse('Please choose an image.');
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
        });
        testResultShape(result, 'image');
      });

      it('mediaType: video', async () => {
        await alertAndWaitForResponse('Please choose a video.');
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        });
        testResultShape(result, 'video');
      });

      it('allows editing', async () => {
        await alertAndWaitForResponse('Please choose an image to crop.');
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
        });
        testResultShape(result, 'image');
      });

      it('allows editing and returns base64', async () => {
        await alertAndWaitForResponse('Please choose an image to crop.');
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          base64: true,
        });

        testResultShape(result, 'image');

        for (const image of result.assets) {
          expect(typeof image.base64).toBe('string');
          expect(image.base64).not.toBe('');
          expect(image.base64).not.toContain('\n');
          expect(image.base64).not.toContain('\r');
        }
      });

      if (Platform.OS === 'ios' && parseInt(Platform.Version, 10) > 10) {
        it('videoExportPreset should affect video dimensions', async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            videoExportPreset: ImagePicker.VideoExportPreset.H264_640x480,
          });

          testResultShape(result, 'video');

          for (const video of result.assets) {
            expect(Math.max(video.width, video.height)).toBeLessThanOrEqual(640);
            expect(Math.min(video.width, video.height)).toBeLessThanOrEqual(480);
          }
        });
      }
    });

    afterAll(() => {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
    });
  });
}
