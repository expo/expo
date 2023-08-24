'use strict';

import { Image } from 'expo-image';
import React from 'react';

import { mountAndWaitFor, mountAndWaitForWithTimeout, TimeoutError } from './helpers';

export const name = 'Image';

const REMOTE_SOURCE = { uri: 'http://source.unsplash.com/random' };
const NON_EXISTENT_SOURCE = { uri: 'file://non_existent_path.jpg' };

export async function test(t, { setPortalChild, cleanupPortal }) {
  t.describe('Image', () => {
    t.afterEach(async () => {
      await cleanupPortal();
    });

    t.describe('onLoadStart', () => {
      t.it('emits an event when the image starts to load (will load successfully)', async () => {
        await mountAndWaitFor(<Image source={REMOTE_SOURCE} />, 'onLoadStart', setPortalChild);
      });

      t.it('emits an event when the image starts to load (will error)', async () => {
        await mountAndWaitFor(
          <Image source={NON_EXISTENT_SOURCE} />,
          'onLoadStart',
          setPortalChild
        );
      });
    });

    t.describe('onLoad', () => {
      t.it('emits an event when the image loads successfully', async () => {
        await mountAndWaitFor(<Image source={REMOTE_SOURCE} />, 'onLoad', setPortalChild);
      });

      t.it('does not emit an event if the image errors', async () => {
        try {
          await mountAndWaitForWithTimeout(
            <Image source={NON_EXISTENT_SOURCE} />,
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
    });

    t.describe('onError', () => {
      t.it('emits an event when the image fails to load successfully', async () => {
        await mountAndWaitFor(<Image source={NON_EXISTENT_SOURCE} />, 'onError', setPortalChild);
      });

      t.it('does not emit an event if the image loads successfully', async () => {
        try {
          await mountAndWaitForWithTimeout(
            <Image source={REMOTE_SOURCE} />,
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
        await mountAndWaitFor(<Image source={REMOTE_SOURCE} />, 'onLoadEnd', setPortalChild);
      });

      t.it('emits an event when the image errors', async () => {
        await mountAndWaitFor(<Image source={NON_EXISTENT_SOURCE} />, 'onLoadEnd', setPortalChild);
      });
    });
  });

  t.describe('prefetch', () => {
    t.it('resolves with true when given a valid image URL', async () => {
      const result = await Image.prefetch(REMOTE_SOURCE.uri);
      t.expect(result).toBe(true); // expecting a true result for valid URLs
    });

    t.it('resolves with false when given an invalid image URL', async () => {
      const result = await Image.prefetch(NON_EXISTENT_SOURCE.uri);
      t.expect(result).toBe(false); // expecting a false result for invalid URLs
    });
  });
}
