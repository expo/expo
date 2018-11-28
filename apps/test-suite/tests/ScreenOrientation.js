'use strict';

import { ScreenOrientation } from 'expo';
import { Platform } from 'react-native';
import { waitFor } from './helpers';

export const name = 'ScreenOrientation';

// run callback every interval until it returns something truthy
const pollUntilSuccessAsync = async (callback, interval = 500) => {
  while (true) {
    const maybePromise = callback();
    let successCondition = false;
    // If obj has a 'then' fn, then its a promise
    if (typeof maybePromise === 'object' && typeof maybePromise.then === 'function') {
      successCondition = await maybePromise;
    } else {
      successCondition = maybePromise;
    }
    if (successCondition) {
      break;
    }
    await waitFor(interval);
  }
};

// Wait until we are in desiredOrientation
// Fail if we are not in a validOrientation
const waitToBeInDesiredOrientation = async (
  t,
  desiredOrientations,
  validOrientations = desiredOrientations
) => {
  await pollUntilSuccessAsync(async () => {
    const orientation = await ScreenOrientation.getOrientationAsync();
    if (!validOrientations.includes(orientation)) {
      t.fail(`Should not have received an orientation of ${orientation}`);
    }
    return desiredOrientations.includes(orientation);
  });
};

// apply orientationLock and ensure that app is currently in the desiredOrientation state
const ensure = async ({ orientationLock, orientation: desiredOrientation }) => {
  // Apply the portrait up policy
  await ScreenOrientation.lockAsync(orientationLock);

  // wait for the policy to be applied
  await pollUntilSuccessAsync(async () => {
    const obtainedOrientation = await ScreenOrientation.getOrientationAsync();
    return obtainedOrientation === desiredOrientation;
  });
};

export function test(t) {
  t.describe('Screen Orientation', () => {
    t.describe('Screen Orientation locking, getters, setters, listeners, etc', () => {
      t.beforeEach(async () => {
        // Put the screen back to PORTRAIT_UP
        await ensure({
          orientationLock: ScreenOrientation.OrientationLock.PORTRAIT_UP,
          orientation: ScreenOrientation.Orientation.PORTRAIT_UP,
        });
      });
      t.it(
        'Sets screen to landscape orientation and gets the correct orientationLock',
        async () => {
          try {
            // set the screen orientation to LANDSCAPE LEFT lock
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_LEFT);

            // detect the correct orientationLock policy immediately
            const orientationLock = await ScreenOrientation.getOrientationLockAsync();
            t.expect(orientationLock).toBe(ScreenOrientation.OrientationLock.LANDSCAPE_LEFT);
          } catch (error) {
            t.fail(error);
          }
        }
      );

      t.it('Sets screen to landscape orientation and gets the correct orientation', async () => {
        try {
          // set the screen orientation to LANDSCAPE LEFT lock
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_LEFT);

          // expect there to be some lag for orientation update to take place
          // poll until we receive a LANDSCAPE_LEFT orientation from the callback
          const desiredOrientation = ScreenOrientation.Orientation.LANDSCAPE_LEFT;
          const validOrientations = [
            ScreenOrientation.Orientation.LANDSCAPE_LEFT,
            ScreenOrientation.Orientation.PORTRAIT_UP,
          ];
          await waitToBeInDesiredOrientation(t, [desiredOrientation], validOrientations);
        } catch (error) {
          t.fail(error);
        }
      });

      // We rely on RN to emit `didUpdateDimensions`
      // If this method no longer works, it's possible that the underlying RN implementation has changed
      // see https://github.com/facebook/react-native/blob/c31f79fe478b882540d7fd31ee37b53ddbd60a17/ReactAndroid/src/main/java/com/facebook/react/modules/deviceinfo/DeviceInfoModule.java#L90
      t.it(
        'Register for the callback, set to landscape orientation and get the correct orientation',
        async () => {
          try {
            // Register for screen orientation changes
            let isLandscapeLeft = false;
            let failureMsg = undefined;
            ScreenOrientation.addOrientationChangeListener(async update => {
              const { orientation } = update;
              if (orientation === ScreenOrientation.Orientation.PORTRAIT_UP) {
                // orientation update has not happened yet
              } else if (orientation === ScreenOrientation.Orientation.LANDSCAPE_LEFT) {
                isLandscapeLeft = true;
              } else {
                failureMsg = `Should not be in orientation: ${orientation}`;
              }
            });

            // set the screen orientation to LANDSCAPE LEFT lock
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_LEFT);

            // poll until we receive a LANDSCAPE_LEFT orientation from the callback
            await pollUntilSuccessAsync(() => isLandscapeLeft);

            // We shouldnt have met any failing conditions
            t.expect(failureMsg).toBe(undefined);
          } catch (error) {
            t.fail(error);
          }
        }
      );

      t.it('Unlock the screen orientation back to default', async () => {
        try {
          // Put the screen to LANDSCAPE_LEFT
          await ensure({
            orientationLock: ScreenOrientation.OrientationLock.LANDSCAPE_LEFT,
            orientation: ScreenOrientation.Orientation.LANDSCAPE_LEFT,
          });

          // Unlock the screen orientation
          await ScreenOrientation.unlockAsync();

          // detect the correct orientationLock policy immediately
          const orientationLock = await ScreenOrientation.getOrientationLockAsync();
          t.expect(orientationLock).toBe(ScreenOrientation.OrientationLock.DEFAULT);

          // expect there to be some lag for orientation update to take place
          // poll until we receive a PORTRAIT_UP orientation from the callback
          const desiredOrientation = ScreenOrientation.Orientation.PORTRAIT_UP;
          const validOrientations = [
            ScreenOrientation.OrientationLock.LANDSCAPE_LEFT,
            ScreenOrientation.Orientation.PORTRAIT_UP,
          ];
          await waitToBeInDesiredOrientation(t, [desiredOrientation], validOrientations);
        } catch (error) {
          t.fail(error);
        }
      });

      t.it('Apply a native android lock', async () => {
        // This test only applies to android devices
        if (Platform.OS !== 'android') {
          return;
        }

        try {
          // Apply the native USER_LANDSCAPE android lock (11)
          // https://developer.android.com/reference/android/R.attr#screenOrientation
          await ScreenOrientation.lockPlatformAsync({ screenOrientationConstantAndroid: 11 });

          // detect the correct orientationLock policy immediately
          const orientationLock = await ScreenOrientation.getOrientationLockAsync();
          t.expect(orientationLock).toBe(ScreenOrientation.OrientationLock.OTHER);

          // expect the native platform getter to return correctly
          const nativeOrientationLock = await ScreenOrientation.getOrientationLockPlatformAsync();
          t.expect(nativeOrientationLock).toBe('11');

          // expect there to be some lag for orientation update to take place
          // poll until we receive a LANDSCAPE orientation from the callback
          const desiredOrientations = [
            ScreenOrientation.Orientation.LANDSCAPE_RIGHT,
            ScreenOrientation.Orientation.LANDSCAPE_LEFT,
          ];
          const validOrientations = [
            ScreenOrientation.Orientation.LANDSCAPE_RIGHT,
            ScreenOrientation.OrientationLock.LANDSCAPE_LEFT,
            ScreenOrientation.Orientation.PORTRAIT_UP,
          ];
          await waitToBeInDesiredOrientation(t, desiredOrientations, validOrientations);
        } catch (error) {
          t.fail(error);
        }
      });

      t.it('Remove all listeners and expect them never to be called', async () => {
        try {
          // Register for screen orientation changes
          let listenerWasCalled = false;
          ScreenOrientation.addOrientationChangeListener(async () => {
            listenerWasCalled = true;
          });

          ScreenOrientation.addOrientationChangeListener(async () => {
            listenerWasCalled = true;
          });

          ScreenOrientation.removeOrientationChangeListeners();

          // set the screen orientation to LANDSCAPE LEFT lock
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_LEFT);

          // If we set a different lock and wait for it to be applied without ever having the
          // listeners invoked, we assume they've been successfully removed
          const desiredOrientation = ScreenOrientation.Orientation.LANDSCAPE_LEFT;
          const validOrientations = [
            ScreenOrientation.Orientation.LANDSCAPE_LEFT,
            ScreenOrientation.Orientation.PORTRAIT_UP,
          ];
          await waitToBeInDesiredOrientation(t, [desiredOrientation], validOrientations);

          await waitFor(200); // account for update lag

          // expect listeners to not have been called
          t.expect(listenerWasCalled).toBe(false);
        } catch (error) {
          t.fail(error);
        }
      });

      t.it('Register some listeners and remove a subset', async () => {
        try {
          // Register for screen orientation changes
          let subscription1Called = false;
          let subscription2Called = false;

          const subscription1 = ScreenOrientation.addOrientationChangeListener(async () => {
            subscription1Called = true;
          });

          ScreenOrientation.addOrientationChangeListener(async () => {
            subscription2Called = true;
          });

          // remove subscription1 ONLY
          ScreenOrientation.removeOrientationChangeListener(subscription1);

          // set the screen orientation to LANDSCAPE LEFT lock
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_LEFT);

          // If we set a different lock and wait for it to be applied without ever having the
          // listeners invoked, we assume they've been successfully removed
          const desiredOrientation = ScreenOrientation.Orientation.LANDSCAPE_LEFT;
          const validOrientations = [
            ScreenOrientation.Orientation.LANDSCAPE_LEFT,
            ScreenOrientation.Orientation.PORTRAIT_UP,
          ];
          await waitToBeInDesiredOrientation(t, [desiredOrientation], validOrientations);

          await waitFor(200); // account for update lag

          // expect subscription1 to NOT have been called
          t.expect(subscription1Called).toBe(false);

          // expect subscription2 to have been called
          t.expect(subscription2Called).toBe(true);
        } catch (error) {
          t.fail(error);
        }
      });

      t.it('Ensure that we correctly detect our supported orientationLocks', async () => {
        const someAcceptedLocks = [
          ScreenOrientation.OrientationLock.OTHER,
          ScreenOrientation.OrientationLock.ALL,
          ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT,
        ];

        for (let lock of someAcceptedLocks) {
          const supported = await ScreenOrientation.supportsOrientationLock(lock);
          console.log(`lock: ${lock} status: ${supported}`);
          t.expect(supported).toBe(true);
        }

        const notLocks = ['FOO', 3, ScreenOrientation.Orientation.UNKNOWN];

        for (let notLock of notLocks) {
          const supported = await ScreenOrientation.supportsOrientationLock(notLock);
          t.expect(supported).toBe(false);
        }
      });
    });
  });
}
