'use strict';

import { Asset } from 'expo-asset';
import { Image } from 'expo-image';
import React from 'react';
import { Platform } from 'react-native';

import { mountAndWaitFor, mountAndWaitForWithTimeout, TimeoutError } from './helpers';

export const name = 'Image';

const REMOTE_SOURCE = {
  uri: 'https://images.unsplash.com/photo-1701743805362-86796f50a0c2?w=1080',
  blurhash: 'LPC6uxxa9GWB01WBs:R*?uayV@WB',
};
const NON_EXISTENT_SOURCE = { uri: 'file://non_existent_path.jpg' };
const ANIMATED_IMAGE_SOURCE = {
  uri: 'https://media1.giphy.com/media/gZEBpuOkPuydi/giphy.gif?cid=ecf05e47fc23hje74g3ryyry6xnui81pej12o4eojtd9ruax&ep=v1_gifs_search&rid=giphy.gif&ct=g',
};

export async function test(t, { setPortalChild, cleanupPortal }) {
  const throws = async (run) => {
    let error = null;
    try {
      await run();
    } catch (e) {
      error = e;
    }
    t.expect(error).toBeTruthy();
  };

  // TODO: Remove the condition once this is implemented on other platforms
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    t.describe('Image', () => {
      t.it('loads an image', async () => {
        const image = await Image.loadAsync(REMOTE_SOURCE);

        t.expect(image).toBeDefined();
        t.expect(image instanceof Image.Image).toBe(true);
        t.expect(image.width).toBeGreaterThan(0);
        t.expect(image.height).toBeGreaterThan(0);
        t.expect(image.scale).toBe(1);
        t.expect(image.isAnimated).toBe(false);
        if (Platform.OS === 'ios') {
          t.expect(image.mediaType).toBe('image/jpeg');
        }
      });

      t.it('loads an animated image', async () => {
        const image = await Image.loadAsync(ANIMATED_IMAGE_SOURCE);

        t.expect(image).toBeDefined();
        t.expect(image instanceof Image.Image).toBe(true);
        t.expect(image.width).toBeGreaterThan(0);
        t.expect(image.height).toBeGreaterThan(0);
        t.expect(image.scale).toBe(1);
        t.expect(image.isAnimated).toBe(true);
        if (Platform.OS === 'ios') {
          t.expect(image.mediaType).toBe('image/gif');
        }
      });

      t.it('loads an local asset image', async () => {
        const image = await Image.loadAsync(require('../assets/icons/app.png'));

        t.expect(image).toBeDefined();
        t.expect(image instanceof Image.Image).toBe(true);
        t.expect(image.width).toBeGreaterThan(0);
        t.expect(image.height).toBeGreaterThan(0);
        t.expect(image.scale).toBe(1);
        t.expect(image.isAnimated).toBe(false);
      });

      t.it('loads a local SVG asset without crashing', async () => {
        const image = await Image.loadAsync(require('../assets/expo.svg'));

        t.expect(image).toBeDefined();
        t.expect(image instanceof Image.Image).toBe(true);
        t.expect(image.width).toBeGreaterThan(0);
        t.expect(image.height).toBeGreaterThan(0);
      });

      t.it('preserves the SVG aspect ratio when maxWidth/maxHeight are provided', async () => {
        const image = await Image.loadAsync(require('../assets/expo.svg'), {
          maxWidth: 64,
          maxHeight: 64,
        });

        t.expect(image.width).toBe(64);
        t.expect(image.height).toBeLessThan(64);
        t.expect(image.height).toBeGreaterThan(0);
        // Aspect ratio should match the viewBox within a small rounding tolerance.
        const aspect = image.width / image.height;
        t.expect(Math.abs(aspect - 24 / 22)).toBeLessThan(0.05);
      });
    });
  }

  t.describe('ImageView', () => {
    t.afterEach(async () => {
      await cleanupPortal();
    });

    t.describe('onLoadStart', () => {
      t.it('emits an event when the image starts to load (will load successfully)', async () => {
        await mountAndWaitFor(
          <Image source={REMOTE_SOURCE} style={{ height: 100, width: 100 }} />,
          'onLoadStart',
          setPortalChild
        );
      });

      t.it('emits an event when the image starts to load (will error)', async () => {
        await mountAndWaitFor(
          <Image source={NON_EXISTENT_SOURCE} style={{ height: 100, width: 100 }} />,
          'onLoadStart',
          setPortalChild
        );
      });
    });

    t.describe('onLoad', () => {
      t.it('emits an event when the image loads successfully', async () => {
        await mountAndWaitFor(
          <Image source={REMOTE_SOURCE} style={{ height: 100, width: 100 }} />,
          'onLoad',
          setPortalChild
        );
      });

      t.it('does not emit an event if the image errors', async () => {
        try {
          await mountAndWaitForWithTimeout(
            <Image source={NON_EXISTENT_SOURCE} style={{ height: 100, width: 100 }} />,
            'onLoad',
            setPortalChild,
            3000
          );
        } catch (e) {
          if (!(e instanceof TimeoutError)) {
            throw e;
          }
        }
      });

      t.it('load animated image and emits animated is true', async () => {
        const event = await mountAndWaitFor(
          <Image source={ANIMATED_IMAGE_SOURCE} style={{ height: 100, width: 100 }} />,
          'onLoad',
          setPortalChild
        );

        t.expect(event.source.isAnimated).toBe(true);
      });
    });

    t.describe('onError', () => {
      t.it('emits an event when the image fails to load successfully', async () => {
        await mountAndWaitFor(
          <Image source={NON_EXISTENT_SOURCE} style={{ height: 100, width: 100 }} />,
          'onError',
          setPortalChild
        );
      });

      t.it('does not emit an event if the image loads successfully', async () => {
        try {
          await mountAndWaitForWithTimeout(
            <Image source={REMOTE_SOURCE} style={{ height: 100, width: 100 }} />,
            'onError',
            setPortalChild,
            3000
          );
        } catch (e) {
          if (!(e instanceof TimeoutError)) {
            throw e;
          }
        }
      });
    });

    t.describe('onLoadEnd', () => {
      t.it('emits an event when the image loads successfully', async () => {
        await mountAndWaitFor(
          <Image source={REMOTE_SOURCE} style={{ height: 100, width: 100 }} />,
          'onLoadEnd',
          setPortalChild
        );
      });

      t.it('emits an event when the image errors', async () => {
        await mountAndWaitFor(
          <Image source={REMOTE_SOURCE} style={{ height: 100, width: 100 }} />,
          'onLoadEnd',
          setPortalChild
        );
      });
    });

    t.describe('getCachePathAsync', () => {
      t.it('returns path to cached image when it does exist in the cache', async () => {
        await mountAndWaitFor(
          <Image source={REMOTE_SOURCE} style={{ height: 100, width: 100 }} />,
          undefined,
          setPortalChild
        );

        const result = await Image.getCachePathAsync(REMOTE_SOURCE.uri);

        t.expect(typeof result).toBe('string');
      });

      t.it('returns a valid image path', async () => {
        const result = await Image.getCachePathAsync(REMOTE_SOURCE.uri);

        if (typeof result != 'string') {
          throw new Error();
        }

        try {
          // On Android, the path should start with file://
          await mountAndWaitForWithTimeout(
            <Image source={'file://' + result} style={{ height: 100, width: 100 }} />,
            'onError',
            setPortalChild,
            3000
          );
        } catch (e) {
          if (!(e instanceof TimeoutError)) {
            throw e;
          }
        }
      });

      t.it('returns null when the image does not exist in the cache', async () => {
        await Image.clearDiskCache();
        const result = await Image.getCachePathAsync(REMOTE_SOURCE.uri);

        t.expect(result).toBe(null);
      });
    });

    t.describe('prefetch', () => {
      t.it('prefetches an image and resolves promise to true', async () => {
        await Image.clearDiskCache();
        const result = await Image.prefetch(REMOTE_SOURCE.uri);
        t.expect(result).toBe(true);

        if (Platform.OS === 'android' || Platform.OS === 'ios') {
          const path = await Image.getCachePathAsync(REMOTE_SOURCE.uri);
          t.expect(typeof path).toBe('string');
        }
      });

      t.it('returns false when prefetching a non-existent image', async () => {
        await Image.clearDiskCache();
        const result = await Image.prefetch(NON_EXISTENT_SOURCE.uri);
        t.expect(result).toBe(false);

        if (Platform.OS === 'android' || Platform.OS === 'ios') {
          const path = await Image.getCachePathAsync(NON_EXISTENT_SOURCE.uri);
          t.expect(path).toBe(null);
        }
      });

      t.it('prefetches an image with headers and resolves promise to true', async () => {
        await Image.clearDiskCache();
        const result = await Image.prefetch(REMOTE_SOURCE.uri, {
          headers: {
            Referer: 'https://expo.dev',
          },
        });
        t.expect(result).toBe(true);

        if (Platform.OS === 'android' || Platform.OS === 'ios') {
          const path = await Image.getCachePathAsync(REMOTE_SOURCE.uri);
          t.expect(typeof path).toBe('string');
        }
      });
    });

    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      t.describe('writeToCacheAsync / readFromCacheAsync', () => {
        const CACHE_KEY = 'test-suite-seeded-image';

        t.it('seeds the cache from an ImageRef and reads it back', async () => {
          await Image.clearDiskCache();
          await Image.clearMemoryCache();
          const image = await Image.loadAsync(REMOTE_SOURCE);

          await Image.writeToCacheAsync(image, CACHE_KEY);

          const path = await Image.getCachePathAsync(CACHE_KEY);
          t.expect(typeof path).toBe('string');

          const cached = await Image.readFromCacheAsync(CACHE_KEY);
          t.expect(cached).toBeDefined();
          t.expect(cached instanceof Image.Image).toBe(true);
          t.expect(cached.width).toBeGreaterThan(0);
          t.expect(cached.height).toBeGreaterThan(0);
        });

        t.it('seeds the cache from a local file URI', async () => {
          await Image.clearDiskCache();
          await Image.clearMemoryCache();

          // A bundled asset gives us a guaranteed local file URI on device.
          const asset = await Asset.fromModule(require('../assets/icons/app.png')).downloadAsync();
          t.expect(typeof asset.localUri).toBe('string');

          await Image.writeToCacheAsync(asset.localUri, CACHE_KEY);

          const path = await Image.getCachePathAsync(CACHE_KEY);
          t.expect(typeof path).toBe('string');

          const cached = await Image.readFromCacheAsync(CACHE_KEY);
          t.expect(cached).toBeDefined();
          t.expect(cached instanceof Image.Image).toBe(true);
        });

        t.it('resolves to null when reading a key that was never seeded', async () => {
          await Image.clearDiskCache();
          await Image.clearMemoryCache();

          const cached = await Image.readFromCacheAsync('test-suite-never-seeded-key');
          t.expect(cached).toBe(null);
        });

        t.it('rejects when given a remote URL', async () => {
          await throws(() => Image.writeToCacheAsync(REMOTE_SOURCE.uri, CACHE_KEY));
        });
      });
    }

    if (Platform.OS === 'ios') {
      t.describe('generateBlurhashAsync', () => {
        t.it('returns a correct blurhash for url', async () => {
          const result = await Image.generateBlurhashAsync(REMOTE_SOURCE.uri, [4, 3]);
          t.expect(result).toBe(REMOTE_SOURCE.blurhash);
        });
        t.it('rejects on a missing url', async () => {
          await throws(Image.generateBlurhashAsync(NON_EXISTENT_SOURCE.uri, [4, 3]));
        });
      });
    }
  });
}
