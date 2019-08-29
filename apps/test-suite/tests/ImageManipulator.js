import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

export const name = 'ImageManipulator';

export async function test({
  beforeAll,
  describe,
  it,
  xit,
  xdescribe,
  beforeEach,
  jasmine,
  expect,
  ...t
}) {
  let image;

  beforeAll(async () => {
    image = Asset.fromModule(require('../assets/example_image_1.jpg'));
    await image.downloadAsync();
  });

  describe('manipulateAsync()', async () => {
    it('returns valid image', async () => {
      const result = await ImageManipulator.manipulateAsync(image.localUri, [
        { resize: { width: 100, height: 100 } },
      ]);
      expect(result).toBeDefined();
      expect(typeof result.uri).toBe('string');
      expect(typeof result.width).toBe('number');
      expect(typeof result.height).toBe('number');
    });

    it('saves with default format', async () => {
      const result = await ImageManipulator.manipulateAsync(image.localUri, [
        { resize: { width: 100, height: 100 } },
      ]);
      expect(result.uri.endsWith('.jpg')).toBe(true);
    });

    it('saves as JPEG', async () => {
      const result = await ImageManipulator.manipulateAsync(
        image.localUri,
        [{ resize: { width: 100, height: 100 } }],
        {
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      expect(result.uri.endsWith('.jpg')).toBe(true);
    });

    it('saves as PNG', async () => {
      const result = await ImageManipulator.manipulateAsync(
        image.localUri,
        [{ resize: { width: 100, height: 100 } }],
        {
          format: ImageManipulator.SaveFormat.PNG,
        }
      );

      expect(result.uri.endsWith('.png')).toBe(true);
    });

    it('provides Base64', async () => {
      const result = await ImageManipulator.manipulateAsync(
        image.localUri,
        [{ resize: { width: 100, height: 100 } }],
        {
          base64: true,
        }
      );

      expect(typeof result.base64).toBe('string');
    });

    it('performs compression', async () => {
      const result = await ImageManipulator.manipulateAsync(
        image.localUri,
        [{ flip: ImageManipulator.FlipType.Vertical }],
        {
          compress: 0.0,
        }
      );

      const imageInfo = await FileSystem.getInfoAsync(image.localUri);
      const resultInfo = await FileSystem.getInfoAsync(result.uri);

      expect(imageInfo.size).toBeGreaterThan(resultInfo.size);
    });

    it('rotates images', async () => {
      const result = await ImageManipulator.manipulateAsync(image.localUri, [{ rotate: 45 }]);
      expect(result.width).toBeGreaterThan(image.width);
    });

    it('flips horizontally', async () => {
      const result = await ImageManipulator.manipulateAsync(image.localUri, [
        { flip: ImageManipulator.FlipType.Horizontal },
      ]);
      expect(result.width).toBe(image.width);
      expect(result.height).toBe(image.height);
    });

    it('flips vertically', async () => {
      const result = await ImageManipulator.manipulateAsync(image.localUri, [
        { flip: ImageManipulator.FlipType.Vertical },
      ]);
      expect(result.width).toBe(image.width);
      expect(result.height).toBe(image.height);
    });

    it('resizes image', async () => {
      const result = await ImageManipulator.manipulateAsync(image.localUri, [
        { resize: { width: 100, height: 100 } },
      ]);
      expect(result.height).toBe(100);
      expect(result.width).toBe(100);
    });

    it('cropes image', async () => {
      const result = await ImageManipulator.manipulateAsync(image.localUri, [
        { crop: { originX: 20, originY: 20, width: 100, height: 100 } },
      ]);
      expect(result.height).toBe(100);
      expect(result.width).toBe(100);
    });

    it('performs multiple transformations', async () => {
      const result = await ImageManipulator.manipulateAsync(image.localUri, [
        { resize: { width: 200, height: 200 } },
        { flip: ImageManipulator.FlipType.Vertical },
        { rotate: 45 },
        { crop: { originX: 20, originY: 20, width: 100, height: 100 } },
      ]);
      expect(result.height).toBe(100);
      expect(result.width).toBe(100);
    });
  });
}
