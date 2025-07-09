import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, ImageManipulator, FlipType, SaveFormat } from 'expo-image-manipulator';
import { Platform } from 'react-native';

export const name = 'ImageManipulator';

export async function test(t) {
  t.describe('ImageManipulator', () => {
    let asset;

    t.beforeAll(async () => {
      asset = Asset.fromModule(require('../assets/example_image_1.jpg'));
      await asset.downloadAsync();
    });

    t.describe('manipulate()', () => {
      t.it('returns a context', () => {
        const context = ImageManipulator.manipulate(asset.localUri);

        t.expect(context).toBeDefined();
        t.expect(context instanceof ImageManipulator.Context).toBe(true);
      });
    });

    t.describe('Context', () => {
      t.it('renders valid image', async () => {
        const context = ImageManipulator.manipulate(asset.localUri).resize({
          width: 100,
          height: 100,
        });
        const image = await context.renderAsync();

        t.expect(image).toBeDefined();
        t.expect(image instanceof ImageManipulator.Image).toBe(true);
        t.expect(image.width).toBe(100);
        t.expect(image.height).toBe(100);
      });

      t.it('renders valid image from base64 data URL', async () => {
        // 1x1 red image
        const context = ImageManipulator.manipulate(
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=='
        ).resize({ width: 100, height: 100 });
        const image = await context.renderAsync();

        t.expect(image).toBeDefined();
        t.expect(image instanceof ImageManipulator.Image).toBe(true);
        t.expect(image.width).toBe(100);
        t.expect(image.height).toBe(100);
      });

      t.it('rotates images', async () => {
        const image = await ImageManipulator.manipulate(asset.localUri).rotate(45).renderAsync();

        t.expect(image.width).toBeGreaterThan(asset.width);
      });

      t.it('flips horizontally', async () => {
        const image = await ImageManipulator.manipulate(asset.localUri)
          .flip('horizontal')
          .renderAsync();

        t.expect(image.width).toBe(asset.width);
        t.expect(image.height).toBe(asset.height);
      });

      t.it('flips vertically', async () => {
        const image = await ImageManipulator.manipulate(asset.localUri)
          .flip('vertical')
          .renderAsync();

        t.expect(image.width).toBe(asset.width);
        t.expect(image.height).toBe(asset.height);
      });

      t.it('resizes image', async () => {
        const image = await ImageManipulator.manipulate(asset.localUri)
          .resize({ width: 100, height: 100 })
          .renderAsync();

        t.expect(image.width).toBe(100);
        t.expect(image.height).toBe(100);
      });

      t.it('crops image', async () => {
        const image = await ImageManipulator.manipulate(asset.localUri)
          .crop({ originX: 20, originY: 20, width: 100, height: 100 })
          .renderAsync();

        t.expect(image.width).toBe(100);
        t.expect(image.height).toBe(100);
      });

      t.it('performs multiple transformations', async () => {
        const context = ImageManipulator.manipulate(asset.localUri);
        const image = await context
          .resize({ width: 200, height: 200 })
          .flip('vertical')
          .rotate(45)
          .crop({ originX: 20, originY: 20, width: 100, height: 100 })
          .renderAsync();

        t.expect(image.height).toBe(100);
        t.expect(image.width).toBe(100);
      });
    });

    t.describe('Image', () => {
      t.it('saves with default format', async () => {
        const image = await ImageManipulator.manipulate(asset.localUri)
          .resize({
            width: 100,
            height: 100,
          })
          .renderAsync();
        const result = await image.saveAsync();

        if (Platform.OS === 'web') {
          t.expect(result.uri.startsWith('data:image/png;base64,')).toBe(true);
        } else {
          t.expect(result.uri.endsWith('.jpg')).toBe(true);
        }
      });

      t.it('saves as JPEG', async () => {
        const image = await ImageManipulator.manipulate(asset.localUri)
          .resize({ width: 100, height: 100 })
          .renderAsync();
        const result = await image.saveAsync({
          format: SaveFormat.JPEG,
        });

        if (Platform.OS === 'web') {
          t.expect(result.uri.startsWith('data:image/jpeg;base64,')).toBe(true);
        } else {
          t.expect(result.uri.endsWith('.jpg')).toBe(true);
        }
      });

      t.it('saves as PNG', async () => {
        const image = await ImageManipulator.manipulate(asset.localUri)
          .resize({ width: 100, height: 100 })
          .renderAsync();
        const result = await image.saveAsync({
          format: SaveFormat.PNG,
        });

        if (Platform.OS === 'web') {
          t.expect(result.uri.startsWith('data:image/png;base64,')).toBe(true);
        } else {
          t.expect(result.uri.endsWith('.png')).toBe(true);
        }
      });

      t.it('provides Base64 with no header or newline terminator', async () => {
        const image = await ImageManipulator.manipulate(asset.localUri)
          .resize({ width: 100, height: 100 })
          .renderAsync();
        const result = await image.saveAsync({
          base64: true,
        });

        t.expect(typeof result.base64).toBe('string');
        t.expect(result.base64).not.toContain('\n');
        t.expect(result.base64).not.toContain('\r');
        t.expect(result.base64?.startsWith('data:image/jpeg;base64,')).toBe(false);
      });

      t.it('performs compression', async () => {
        const image = await ImageManipulator.manipulate(asset.localUri)
          .flip('vertical')
          .renderAsync();
        const result = await image.saveAsync({
          format: SaveFormat.JPEG,
          compress: 0.0,
        });

        if (Platform.OS === 'web') {
          const originalInfo = await fetch(asset.localUri).then((a) => a.blob());
          const resultInfo = await fetch(result.uri).then((a) => a.blob());

          t.expect(originalInfo.size).toBeGreaterThan(resultInfo.size);
        } else {
          const originalInfo = await FileSystem.getInfoAsync(asset.localUri);
          const resultInfo = await FileSystem.getInfoAsync(result.uri);

          t.expect(originalInfo.size).toBeGreaterThan(resultInfo.size);
        }
      });
    });
  });

  t.describe('ImageManipulator (Legacy)', () => {
    let image;

    t.beforeAll(async () => {
      image = Asset.fromModule(require('../assets/example_image_1.jpg'));
      await image.downloadAsync();
    });

    t.describe('manipulateAsync()', () => {
      t.it('returns valid image', async () => {
        const result = await manipulateAsync(image.localUri, [
          { resize: { width: 100, height: 100 } },
        ]);
        t.expect(result).toBeDefined();
        t.expect(typeof result.uri).toBe('string');
        t.expect(typeof result.width).toBe('number');
        t.expect(typeof result.height).toBe('number');
      });

      t.it('returns valid image from base64 data URL', async () => {
        // 1x1 red image
        const result = await manipulateAsync(
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
          [{ resize: { width: 100, height: 100 } }]
        );
        t.expect(result).toBeDefined();
        t.expect(typeof result.uri).toBe('string');
        t.expect(result.width).toBe(100);
        t.expect(result.height).toBe(100);
      });

      t.it('saves with default format', async () => {
        const result = await manipulateAsync(image.localUri, [
          { resize: { width: 100, height: 100 } },
        ]);

        if (Platform.OS === 'web') {
          t.expect(result.uri.startsWith('data:image/jpeg;base64,')).toBe(true);
        } else {
          t.expect(result.uri.endsWith('.jpg')).toBe(true);
        }
      });

      t.it('saves as JPEG', async () => {
        const result = await manipulateAsync(
          image.localUri,
          [{ resize: { width: 100, height: 100 } }],
          {
            format: SaveFormat.JPEG,
          }
        );

        if (Platform.OS === 'web') {
          t.expect(result.uri.startsWith('data:image/jpeg;base64,')).toBe(true);
        } else {
          t.expect(result.uri.endsWith('.jpg')).toBe(true);
        }
      });

      t.it('saves as PNG', async () => {
        const result = await manipulateAsync(
          image.localUri,
          [{ resize: { width: 100, height: 100 } }],
          {
            format: SaveFormat.PNG,
          }
        );

        if (Platform.OS === 'web') {
          t.expect(result.uri.startsWith('data:image/png;base64,')).toBe(true);
        } else {
          t.expect(result.uri.endsWith('.png')).toBe(true);
        }
      });

      t.it('provides Base64 with no header or newline terminator', async () => {
        const result = await manipulateAsync(
          image.localUri,
          [{ resize: { width: 100, height: 100 } }],
          {
            base64: true,
          }
        );

        t.expect(typeof result.base64).toBe('string');
        t.expect(result.base64).not.toContain('\n');
        t.expect(result.base64).not.toContain('\r');
        t.expect(result.base64.startsWith('data:image/jpeg;base64,')).toBe(false);
      });

      t.it('performs compression', async () => {
        const result = await manipulateAsync(image.localUri, [{ flip: FlipType.Vertical }], {
          compress: 0.0,
        });

        if (Platform.OS === 'web') {
          const imageInfo = await fetch(image.localUri).then((a) => a.blob());
          const resultInfo = await fetch(result.uri).then((a) => a.blob());

          t.expect(imageInfo.size).toBeGreaterThan(resultInfo.size);
        } else {
          const imageInfo = await FileSystem.getInfoAsync(image.localUri);
          const resultInfo = await FileSystem.getInfoAsync(result.uri);

          t.expect(imageInfo.size).toBeGreaterThan(resultInfo.size);
        }
      });

      t.it('rotates images', async () => {
        const result = await manipulateAsync(image.localUri, [{ rotate: 45 }]);
        t.expect(result.width).toBeGreaterThan(image.width);
      });

      t.it('flips horizontally', async () => {
        const result = await manipulateAsync(image.localUri, [{ flip: FlipType.Horizontal }]);
        t.expect(result.width).toBe(image.width);
        t.expect(result.height).toBe(image.height);
      });

      t.it('flips vertically', async () => {
        const result = await manipulateAsync(image.localUri, [{ flip: FlipType.Vertical }]);
        t.expect(result.width).toBe(image.width);
        t.expect(result.height).toBe(image.height);
      });

      t.it('resizes image', async () => {
        const result = await manipulateAsync(image.localUri, [
          { resize: { width: 100, height: 100 } },
        ]);
        t.expect(result.height).toBe(100);
        t.expect(result.width).toBe(100);
      });

      t.it('crops image', async () => {
        const result = await manipulateAsync(image.localUri, [
          { crop: { originX: 20, originY: 20, width: 100, height: 100 } },
        ]);
        t.expect(result.height).toBe(100);
        t.expect(result.width).toBe(100);
      });

      t.it('performs multiple transformations', async () => {
        const result = await manipulateAsync(image.localUri, [
          { resize: { width: 200, height: 200 } },
          { flip: FlipType.Vertical },
          { rotate: 45 },
          { crop: { originX: 20, originY: 20, width: 100, height: 100 } },
        ]);
        t.expect(result.height).toBe(100);
        t.expect(result.width).toBe(100);
      });
    });
  });
}
