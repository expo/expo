'use strict';

import * as ScreenOrientation from 'expo-screen-orientation';
import { Platform } from 'react-native';

export const name = 'ScreenOrientation';

// Wait until we are in desiredOrientation
// Fail if we are not in a validOrientation
const applyAsync = ({ desiredOrientationLock, desiredOrientations, validOrientations }) => {
  return new Promise(async function (resolve, reject) {
    let subscriptionCancelled = false;
    const subscription = ScreenOrientation.addOrientationChangeListener(
      ({ orientationInfo, orientationLock }) => {
        const { orientation } = orientationInfo;
        if (validOrientations && !validOrientations.includes(orientation)) {
          reject(new Error(`Should not have received an orientation of ${orientation}`));
        }
        if (desiredOrientations && !desiredOrientations.includes(orientation)) {
          return;
        } else if (desiredOrientationLock && orientationLock !== desiredOrientationLock) {
          return;
        }

        // We have met all the desired orientation conditions
        // remove itself
        if (!subscriptionCancelled) {
          ScreenOrientation.removeOrientationChangeListener(subscription);
          subscriptionCancelled = true;
        }

        // resolve promise
        resolve();
      }
    );

    if (desiredOrientationLock) {
      // set the screen orientation to desired orientation lock
      await ScreenOrientation.lockAsync(desiredOrientationLock);
    }

    const orientation = await ScreenOrientation.getOrientationAsync();
    const orientationLock = await ScreenOrientation.getOrientationLockAsync();
    if (desiredOrientations && !desiredOrientations.includes(orientation)) {
      return;
    } else if (desiredOrientationLock && orientationLock !== desiredOrientationLock) {
      return;
    }

    // We have met all the desired orientation conditions
    // remove previous subscription
    if (!subscriptionCancelled) {
      ScreenOrientation.removeOrientationChangeListener(subscription);
      subscriptionCancelled = true;
    }
    resolve();
  });
};

export function test(t) {
  t.describe('Screen Orientation', () => {
    t.describe('Screen Orientation locking, getters, setters, listeners, etc', () => {
      t.beforeEach(async () => {
        // Put the screen back to PORTRAIT_UP
        const desiredOrientation = ScreenOrientation.Orientation.PORTRAIT_UP;

        await applyAsync({
          desiredOrientationLock: ScreenOrientation.OrientationLock.PORTRAIT_UP,
          desiredOrientations: [desiredOrientation],
        });
      });

      t.afterEach(() => {
        ScreenOrientation.removeOrientationChangeListeners();
      });

      t.afterAll(async () => {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.DEFAULT);
      });

      t.it(
        'Sets screen to landscape orientation and gets the correct orientationLock',
        async () => {
          // set the screen orientation to LANDSCAPE LEFT lock
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_LEFT);

          // detect the correct orientationLock policy immediately
          const orientationLock = await ScreenOrientation.getOrientationLockAsync();
          t.expect(orientationLock).toBe(ScreenOrientation.OrientationLock.LANDSCAPE_LEFT);
        }
      );

      t.it('Sets screen to landscape orientation and gets the correct orientation', async () => {
        const desiredOrientationLock = ScreenOrientation.OrientationLock.LANDSCAPE_LEFT;
        const desiredOrientation = ScreenOrientation.Orientation.LANDSCAPE_LEFT;
        const validOrientations = [
          ScreenOrientation.Orientation.LANDSCAPE_LEFT,
          ScreenOrientation.Orientation.PORTRAIT_UP,
        ];
        await applyAsync({
          desiredOrientationLock,
          desiredOrientations: [desiredOrientation],
          validOrientations,
        });

        const orientation = await ScreenOrientation.getOrientationAsync();
        t.expect(orientation).toBe(ScreenOrientation.Orientation.LANDSCAPE_LEFT);
      });

      // We rely on RN to emit `didUpdateDimensions`
      // If this method no longer works, it's possible that the underlying RN implementation has changed
      // see https://github.com/facebook/react-native/blob/c31f79fe478b882540d7fd31ee37b53ddbd60a17/ReactAndroid/src/main/java/com/facebook/react/modules/deviceinfo/DeviceInfoModule.java#L90
      t.it(
        'Register for the callback, set to landscape orientation and get the correct orientation',
        async () => {
          const callListenerAsync = new Promise(async function (resolve, reject) {
            // Register for screen orientation changes
            ScreenOrientation.addOrientationChangeListener(({ orientationInfo }) => {
              const { orientation } = orientationInfo;
              if (orientation === ScreenOrientation.Orientation.PORTRAIT_UP) {
                // orientation update has not happened yet
              } else if (orientation === ScreenOrientation.Orientation.LANDSCAPE_LEFT) {
                resolve();
              } else {
                reject(new Error(`Should not be in orientation: ${orientation}`));
              }
            });

            // Put the screen to LANDSCAPE_LEFT
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_LEFT);
          });

          // Wait for listener to get called
          await callListenerAsync;
        }
      );

      t.it('Unlock the screen orientation back to default', async () => {
        // Put the screen to LANDSCAPE_LEFT
        await applyAsync({
          desiredOrientationLock: ScreenOrientation.OrientationLock.LANDSCAPE_LEFT,
          desiredOrientations: [ScreenOrientation.Orientation.LANDSCAPE_LEFT],
        });

        // Unlock the screen orientation
        await ScreenOrientation.unlockAsync();

        // detect the correct orientationLock policy immediately
        const orientationLock = await ScreenOrientation.getOrientationLockAsync();
        t.expect(orientationLock).toBe(ScreenOrientation.OrientationLock.DEFAULT);
      });

      // This test only applies to android devices
      if (Platform.OS === 'android') {
        t.it('Apply a native android lock', async () => {
          // Apply the native USER_LANDSCAPE android lock (11)
          // https://developer.android.com/reference/android/R.attr#screenOrientation
          await ScreenOrientation.lockPlatformAsync({ screenOrientationConstantAndroid: 11 });

          // detect the correct orientationLock policy immediately
          const orientationLock = await ScreenOrientation.getOrientationLockAsync();
          t.expect(orientationLock).toBe(ScreenOrientation.OrientationLock.OTHER);

          // expect the native platform getter to return correctly
          const platformInfo = await ScreenOrientation.getPlatformOrientationLockAsync();
          const { screenOrientationConstantAndroid } = platformInfo;
          t.expect(screenOrientationConstantAndroid).toBe(11);

          const desiredOrientations = [
            ScreenOrientation.Orientation.LANDSCAPE_RIGHT,
            ScreenOrientation.Orientation.LANDSCAPE_LEFT,
          ];
          const validOrientations = [
            ScreenOrientation.Orientation.LANDSCAPE_RIGHT,
            ScreenOrientation.Orientation.LANDSCAPE_LEFT,
            ScreenOrientation.Orientation.PORTRAIT_UP,
          ];
          await applyAsync({ desiredOrientations, validOrientations });
        });
      }

      // This test only applies to ios devices
      if (Platform.OS === 'ios') {
        t.it('Apply a native iOS lock', async () => {
          // Allow only PORTRAIT_UP and LANDSCAPE_RIGHT
          await ScreenOrientation.lockPlatformAsync({
            screenOrientationArrayIOS: [
              ScreenOrientation.Orientation.PORTRAIT_UP,
              ScreenOrientation.Orientation.LANDSCAPE_RIGHT,
            ],
          });

          // detect the correct orientationLock policy immediately
          const orientationLock = await ScreenOrientation.getOrientationLockAsync();
          t.expect(orientationLock).toBe(ScreenOrientation.OrientationLock.OTHER);

          // expect the native platform getter to return correctly
          const platformInfo = await ScreenOrientation.getPlatformOrientationLockAsync();
          const { screenOrientationArrayIOS } = platformInfo;
          t.expect(screenOrientationArrayIOS).toContain(
            ScreenOrientation.Orientation.LANDSCAPE_RIGHT
          );
          t.expect(screenOrientationArrayIOS).toContain(ScreenOrientation.Orientation.PORTRAIT_UP);

          const desiredOrientations = [
            ScreenOrientation.Orientation.PORTRAIT_UP,
            ScreenOrientation.Orientation.LANDSCAPE_RIGHT,
          ];
          const validOrientations = [
            ScreenOrientation.Orientation.PORTRAIT_UP,
            ScreenOrientation.Orientation.LANDSCAPE_RIGHT,
          ];
          await applyAsync({ desiredOrientations, validOrientations });
        });
      }

      t.it('Remove all listeners and expect them never to be called', async () => {
        // Register for screen orientation changes
        let listenerWasCalled = false;
        ScreenOrientation.addOrientationChangeListener(() => {
          listenerWasCalled = true;
        });

        ScreenOrientation.addOrientationChangeListener(() => {
          listenerWasCalled = true;
        });

        ScreenOrientation.removeOrientationChangeListeners();

        // set the screen orientation to LANDSCAPE LEFT lock
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_LEFT);

        // If we set a different lock and wait for it to be applied without ever having the
        // listeners invoked, we assume they've been successfully removed
        const desiredOrientations = [ScreenOrientation.Orientation.LANDSCAPE_LEFT];
        const validOrientations = [
          ScreenOrientation.Orientation.LANDSCAPE_LEFT,
          ScreenOrientation.Orientation.PORTRAIT_UP,
        ];
        await applyAsync({ desiredOrientations, validOrientations });

        // expect listeners to not have been called
        t.expect(listenerWasCalled).toBe(false);
      });

      /*
      This test fails about half the time on CI with the error that it expected false to be true.
      This means that the check that subscription2Called is true fails.
      It may be a problem with the removeOrientationChangeListener implementation since
      this is the only test that calls that function on an external subscription while another is active.

      t.it('Register some listeners and remove a subset', async () => {
        // Register for screen orientation changes
        let subscription1Called = false;
        let subscription2Called = false;

        const subscription1 = ScreenOrientation.addOrientationChangeListener(() => {
          subscription1Called = true;
        });

        ScreenOrientation.addOrientationChangeListener(() => {
          subscription2Called = true;
        });

        // remove subscription1 ONLY
        ScreenOrientation.removeOrientationChangeListener(subscription1);

        // set the screen orientation to LANDSCAPE LEFT lock
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_LEFT);

        // If we set a different lock and wait for it to be applied without ever having the
        // listeners invoked, we assume they've been successfully removed
        const desiredOrientations = [ScreenOrientation.Orientation.LANDSCAPE_LEFT];
        const validOrientations = [
          ScreenOrientation.Orientation.LANDSCAPE_LEFT,
          ScreenOrientation.Orientation.PORTRAIT_UP,
        ];
        await applyAsync({ desiredOrientations, validOrientations });

        // expect subscription1 to NOT have been called
        t.expect(subscription1Called).toBe(false);

        // expect subscription2 to have been called
        t.expect(subscription2Called).toBe(true);
      });
      */

      t.it('supports accepted orientation locks', async () => {
        // orientation locks that we should be able to apply
        const acceptedLocks = [
          ScreenOrientation.OrientationLock.DEFAULT,
          ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT,
        ];

        for (const lock of acceptedLocks) {
          const supported = await ScreenOrientation.supportsOrientationLockAsync(lock);
          t.expect(supported).toBe(true);
        }
      });

      t.it("doesn't support unsupported orientation locks", async () => {
        // This is not a lock policy that we can apply
        const unsupportedLock = ScreenOrientation.OrientationLock.OTHER;
        const supported = await ScreenOrientation.supportsOrientationLockAsync(unsupportedLock);
        t.expect(supported).toBe(false);
      });

      t.it('throws an error when asked for non-lock values', async () => {
        // Expect non-lock values to throw an error
        const notLocks = ['FOO', 99, -1];
        for (const notLock of notLocks) {
          let hasError = false;
          try {
            await ScreenOrientation.supportsOrientationLockAsync(notLock);
          } catch {
            hasError = true;
          }
          t.expect(hasError).toBe(true);
        }
      });
    });
  });
}
