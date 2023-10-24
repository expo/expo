'use strict';

import { Image } from 'expo-image';
import React from 'react';
import { Platform } from 'react-native';

import { mountAndWaitFor, mountAndWaitForWithTimeout, TimeoutError } from './helpers';

export const name = 'Image';

const REMOTE_SOURCE = { uri: 'http://source.unsplash.com/random' };
const NON_EXISTENT_SOURCE = { uri: 'file://non_existent_path.jpg' };
const ANIMATED_IMAGE_SOURCE = {
  uri: 'https://bafybeidoycivu5if7a3gu3uxozztrdbxe3udjp6jvmit2jub3fjtkxfuoi.ipfs.nftstorage.link/38.webp',
};

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

      if(Platform.OS === "ios") {
        t.it('load animated image and emits animated is true', async () => {
          const event = await mountAndWaitFor(
            <Image source={ANIMATED_IMAGE_SOURCE} style={{ height: 100, width: 100 }} />,
            'onLoad',
            setPortalChild
          );

          t.expect(event.source.animated).toBe(true);
        });
      }
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
}
