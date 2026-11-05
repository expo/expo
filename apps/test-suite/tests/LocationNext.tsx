import { PermissionStatus } from 'expo';
import {
  BackgroundSessionState,
  Location,
  LocationAccuracy,
  LocationProfile,
  LocationProvider,
  LocationScope,
  LocationUpdatesHandle,
  PositionWatchHandle,
  RequestPermissionsAccuracyOption,
  useBackgroundLocationPermissions,
  useForegroundLocationPermissions,
  useLocationServices,
  useNotificationPermissions,
  type Address,
  type Coordinates,
  type LocationPermissionResponse,
  type PositionWatchStatus,
} from 'expo-location/next';
import * as TaskManager from 'expo-task-manager';
import React from 'react';
import { Platform } from 'react-native';

import * as TestUtils from '../TestUtils';
import type { JasmineInterface, TestPortal } from '../types';
import { requireNotNull } from '../utils/requireNotNull';
import {
  BACKGROUND_LOCATION_TASK,
  describeForEachProvider,
  expectPosition,
  PERMISSION_TIMEOUT,
  selectDefaultProvider,
  TASK_TIMEOUT,
} from './LocationNextHelpers';
import { mountAndWaitForWithTimeout, waitFor } from './helpers';

const GEOCODING_TIMEOUT = 3000;
const GET_POSITION_TIMEOUT = 4000;
const HOOK_TIMEOUT = 3000;
const SESSION_TIMEOUT = 3000;
const SESSION_POLL_INTERVAL = 100;
const ANDROID_O = 26;
const PLACE_TOLERANCE_DEGREES = 1;

const INFINITE_LOOP = {
  query: '1 Infinite Loop, Cupertino',
  isoCountryCode: 'US',
  coordinates: { latitude: 37.3318, longitude: -122.0312 },
};
const HELSINKI = {
  isoCountryCode: 'FI',
  coordinates: { latitude: 60.166595, longitude: 24.944865 },
};
const VIENNA = {
  query: 'Wien, Austria',
  isoCountryCode: 'AT',
  coordinates: { latitude: 48.2082, longitude: 16.3738 },
};

const ANDROID_BACKGROUND_UPDATES = {
  [LocationProfile.DEFAULT]: {
    priority: 'BALANCED_POWER_ACCURACY',
    interval: 60000,
    maxUpdateDelay: 300000,
    minUpdateDistance: 100,
  },
  [LocationProfile.LOW_POWER]: {
    priority: 'LOW_POWER',
    interval: 900000,
    maxUpdateDelay: 3600000,
    minUpdateDistance: 500,
  },
};

type Place = { isoCountryCode: string; coordinates: Coordinates };
type RegisteredProfile = keyof typeof ANDROID_BACKGROUND_UPDATES;

export const name = 'Location@Next';

const useForegroundPermission = () => useForegroundLocationPermissions()[0];
const useBackgroundPermission = () => useBackgroundLocationPermissions()[0];
const useNotificationPermission = () => useNotificationPermissions()[0];

function HookProbe<T>({
  useValue,
  isReady,
  onReady,
}: {
  useValue: () => T;
  isReady: (value: T) => boolean;
  onReady: (value: T) => void;
}) {
  const value = useValue();
  React.useEffect(() => {
    if (isReady(value)) {
      onReady(value);
    }
  });
  return null;
}

async function readHookValue<T>(
  useValue: () => T,
  isReady: (value: T) => boolean,
  portal: TestPortal
): Promise<T> {
  try {
    return await mountAndWaitForWithTimeout<T>(
      <HookProbe useValue={useValue} isReady={isReady} onReady={() => {}} />,
      'onReady',
      portal.setPortalChild,
      HOOK_TIMEOUT
    );
  } finally {
    await portal.cleanupPortal();
  }
}

export async function test(t: JasmineInterface, portal: TestPortal) {
  const shouldSkipTestsRequiringPermissions =
    await TestUtils.shouldSkipTestsRequiringPermissionsAsync();
  const describeWithPermissions = shouldSkipTestsRequiringPermissions ? t.xdescribe : t.describe;
  const isAndroid = Platform.OS === 'android';

  function expectPermissionResponse(permission: LocationPermissionResponse) {
    t.expect([
      PermissionStatus.GRANTED,
      PermissionStatus.DENIED,
      PermissionStatus.UNDETERMINED,
    ]).toContain(permission.status);
    t.expect(typeof permission.granted).toBe('boolean');
    t.expect(typeof permission.canAskAgain).toBe('boolean');
    t.expect(permission.expires === 'never' || typeof permission.expires === 'number').toBe(true);
    t.expect([
      LocationScope.ALWAYS,
      LocationScope.WHEN_IN_USE,
      LocationScope.NOT_GRANTED,
    ]).toContain(permission.scope);
    t.expect([
      LocationAccuracy.FULL,
      LocationAccuracy.REDUCED,
      LocationAccuracy.NOT_GRANTED,
    ]).toContain(permission.accuracy);
    t.expect(permission.accuracy === LocationAccuracy.NOT_GRANTED).toBe(
      permission.scope === LocationScope.NOT_GRANTED
    );
  }

  function expectAddress(address: Address, place: Place) {
    t.expect(typeof address.coordinates.latitude).toBe('number');
    t.expect(typeof address.coordinates.longitude).toBe('number');
    t.expect(Math.abs(address.coordinates.latitude - place.coordinates.latitude)).toBeLessThan(
      PLACE_TOLERANCE_DEGREES
    );
    t.expect(Math.abs(address.coordinates.longitude - place.coordinates.longitude)).toBeLessThan(
      PLACE_TOLERANCE_DEGREES
    );

    const nullableFields = ['name', 'formattedAddress', 'city', 'country'] as const;
    for (const field of nullableFields) {
      const value = address[field];
      t.expect(value === null || typeof value === 'string').toBe(true);
    }
    t.expect(address.isoCountryCode).toBe(place.isoCountryCode);
  }

  function expectWatchStatus(status: PositionWatchStatus) {
    const flags = [
      'isSubscribed',
      'isHandleAlive',
      'isStarted',
      'isPaused',
      'isInForeground',
    ] as const;
    for (const flag of flags) {
      t.expect(typeof status[flag]).toBe('boolean');
    }
    const androidOnly = isAndroid ? 'boolean' : 'undefined';
    t.expect(typeof status.canDeliverUpdates).toBe(androidOnly);
    t.expect(typeof status.areUpdatesAllowed).toBe(androidOnly);
  }

  async function geocodingOrPending<T>(call: () => Promise<T>): Promise<T> {
    try {
      return await call();
    } catch (error: any) {
      const code = error?.code;
      if (code === 'ERR_NO_GEOCODING_BACKEND' || code === 'ERR_GEOCODING_UNAVAILABLE') {
        t.pending('the device has no reachable geocoding backend');
      }
      throw error;
    }
  }

  async function expectRejectionCode(call: () => Promise<unknown>, code: string) {
    let error: any = null;
    try {
      await call();
    } catch (caught) {
      error = caught;
    }
    t.expect(error).not.toBeNull();
    t.expect(error?.code).toBe(code);
  }

  function expectThrownCode(call: () => unknown, code: string) {
    let error: any = null;
    try {
      call();
    } catch (caught) {
      error = caught;
    }
    t.expect(error).not.toBeNull();
    t.expect(error?.code).toBe(code);
  }

  function watchHandle() {
    return Location.watchPosition({ onPosition: () => {} });
  }

  async function registeredLocationTask() {
    const tasks = await TaskManager.getRegisteredTasksAsync();
    return requireNotNull(tasks.find((task) => task.taskName === BACKGROUND_LOCATION_TASK));
  }

  function expectRegisteredProfile(task: TaskManager.TaskManagerTask, profile: RegisteredProfile) {
    if (!isAndroid) {
      t.expect(task.taskType).toBe('locationNext');
      t.expect(task.options.profile).toBe(profile);
      return;
    }
    t.expect(task.taskType).toBe('location');
    for (const [key, value] of Object.entries(ANDROID_BACKGROUND_UPDATES[profile])) {
      t.expect(task.options[key]).toBe(value);
    }
  }

  async function waitForBackgroundSessionState(state: BackgroundSessionState) {
    const deadline = Date.now() + SESSION_TIMEOUT;
    while (Location.getBackgroundSessionStatus().state !== state && Date.now() < deadline) {
      await waitFor(SESSION_POLL_INTERVAL);
    }
    return Location.getBackgroundSessionStatus();
  }

  t.describe('Location (next)', () => {
    describeWithPermissions('Location.requestForegroundPermissions()', () => {
      t.it(
        'grants the foreground permission',
        async () => {
          const permission: LocationPermissionResponse =
            await TestUtils.acceptPermissionsAndRunCommandAsync(() =>
              Location.requestForegroundPermissions()
            );
          expectPermissionResponse(permission);
          t.expect(permission.granted).toBe(true);
          t.expect(permission.status).toBe(PermissionStatus.GRANTED);
          t.expect(permission.scope).not.toBe(LocationScope.NOT_GRANTED);
        },
        PERMISSION_TIMEOUT
      );

      t.it('keeps the granted accuracy on a reduced accuracy request', async () => {
        const before = await Location.getForegroundPermissions();
        const permission = await Location.requestForegroundPermissions({
          accuracy: RequestPermissionsAccuracyOption.REDUCED,
        });
        expectPermissionResponse(permission);
        t.expect(permission.granted).toBe(true);
        t.expect(permission.accuracy).toBe(before.accuracy);
      });
    });

    describeWithPermissions('Location.getForegroundPermissions()', () => {
      t.it('reads the foreground permission without asking', async () => {
        const permission = await Location.getForegroundPermissions();
        expectPermissionResponse(permission);
        t.expect(permission.granted).toBe(true);
        t.expect(permission.scope).not.toBe(LocationScope.NOT_GRANTED);
      });
    });

    describeWithPermissions('Location.requestBackgroundPermissions()', () => {
      t.it(
        'grants the background permission',
        async () => {
          const permission: LocationPermissionResponse =
            await TestUtils.acceptPermissionsAndRunCommandAsync(() =>
              Location.requestBackgroundPermissions()
            );
          expectPermissionResponse(permission);
          t.expect(permission.granted).toBe(true);
          t.expect(permission.scope).toBe(LocationScope.ALWAYS);
        },
        PERMISSION_TIMEOUT
      );
    });

    describeWithPermissions('Location.getBackgroundPermissions()', () => {
      t.it('reads the background permission without asking', async () => {
        const permission = await Location.getBackgroundPermissions();
        expectPermissionResponse(permission);
        t.expect(permission.granted).toBe(true);
        t.expect(permission.scope).toBe(LocationScope.ALWAYS);
      });
    });

    t.describe('Location.getNotificationPermissions()', () => {
      if (isAndroid) {
        t.it('reads the notification permission', async () => {
          const permission = await Location.getNotificationPermissions();
          t.expect([
            PermissionStatus.GRANTED,
            PermissionStatus.DENIED,
            PermissionStatus.UNDETERMINED,
          ]).toContain(permission.status);
          t.expect(typeof permission.granted).toBe('boolean');
          t.expect(typeof permission.canAskAgain).toBe('boolean');
          t.expect(permission.granted).toBe(permission.status === PermissionStatus.GRANTED);
        });
      } else {
        t.it('is unavailable', async () => {
          await TestUtils.expectMethodToBeUnavailableAsync(
            t.expect,
            Location.getNotificationPermissions
          );
        });
      }
    });

    t.describe('Location.requestNotificationPermissions()', () => {
      if (isAndroid) {
        describeWithPermissions('on a device', () => {
          t.it(
            'settles the notification permission',
            async () => {
              const permission = await TestUtils.acceptPermissionsAndRunCommandAsync(() =>
                Location.requestNotificationPermissions()
              );
              t.expect([PermissionStatus.GRANTED, PermissionStatus.DENIED]).toContain(
                permission.status
              );
              t.expect(permission.granted).toBe(permission.status === PermissionStatus.GRANTED);
            },
            PERMISSION_TIMEOUT
          );
        });
      } else {
        t.it('is unavailable', async () => {
          await TestUtils.expectMethodToBeUnavailableAsync(
            t.expect,
            Location.requestNotificationPermissions
          );
        });
      }
    });

    t.describe('Location.hasLocationServicesEnabled()', () => {
      t.it('location services are on', () => {
        t.expect(Location.hasLocationServicesEnabled()).toBe(true);
      });
    });

    t.describe('Location.enableLocationServices()', () => {
      if (isAndroid) {
        t.it('resolves with true when services are already on', async () => {
          t.expect(await Location.enableLocationServices()).toBe(true);
        });
      }
    });

    describeForEachProvider(t, () => {
      describeWithPermissions('Location.getPosition()', () => {
        t.it(
          'resolves with a position of the documented shape',
          async () => {
            const position = await Location.getPosition({
              profile: LocationProfile.AUTOMOTIVE_NAVIGATION,
              timeout: 1,
            });
            expectPosition(t, requireNotNull(position));
          },
          GET_POSITION_TIMEOUT
        );

        t.it(
          'returns the last known position with a zero timeout',
          async () => {
            const position = await Location.getPosition({
              profile: LocationProfile.AUTOMOTIVE_NAVIGATION,
              timeout: 0,
            });
            if (position === null) {
              t.pending('no last known position');
              return;
            }
            expectPosition(t, position);
          },
          GET_POSITION_TIMEOUT
        );

        t.it(
          'returns a cached fix within maxCachedAge',
          async () => {
            const first = requireNotNull(
              await Location.getPosition({
                profile: LocationProfile.AUTOMOTIVE_NAVIGATION,
                timeout: 0,
              })
            );
            const cached = requireNotNull(
              await Location.getPosition({
                profile: LocationProfile.AUTOMOTIVE_NAVIGATION,
                maxCachedAge: 600,
                timeout: 3,
              })
            );
            expectPosition(t, cached);
            t.expect(cached.timestamp).toBeGreaterThanOrEqual(first.timestamp);
          },
          GET_POSITION_TIMEOUT * 2
        );

        t.it(
          'returns the last known position for every profile',
          async () => {
            for (const profile of Object.values(LocationProfile)) {
              const position = await Location.getPosition({ profile, timeout: 0 });
              if (position === null) {
                t.pending('no last known position');
                return;
              }
              expectPosition(t, position);
            }
          },
          GET_POSITION_TIMEOUT
        );
      });

      describeWithPermissions('Location.watchPosition()', () => {
        t.it('reports the watcher flags', () => {
          const handle = watchHandle();
          try {
            const status = handle.status();
            expectWatchStatus(status);
            t.expect(status.isHandleAlive).toBe(true);
            t.expect(status.isStarted).toBe(true);
            t.expect(status.isPaused).toBe(false);
            t.expect(status.isSubscribed).toBe(true);
            t.expect(status.isInForeground).toBe(true);
            if (isAndroid) {
              t.expect(status.areUpdatesAllowed).toBe(true);
            }
          } finally {
            handle.dispose();
          }
        });
      });

      describeWithPermissions('Location.PositionWatchHandle', () => {
        t.it('creates a watcher without a listener', () => {
          const handle = new PositionWatchHandle(LocationProfile.LOW_POWER);
          try {
            const status = handle.status();
            expectWatchStatus(status);
            t.expect(status.isHandleAlive).toBe(true);
            t.expect(status.isStarted).toBe(!isAndroid);
          } finally {
            handle.dispose();
          }
        });

        t.it('starts on the first listener', () => {
          const handle = new PositionWatchHandle();
          try {
            const subscription = handle.addListener(() => {});
            t.expect(handle.status().isStarted).toBe(true);

            subscription.remove();
            t.expect(handle.status().isStarted).toBe(!isAndroid);
          } finally {
            handle.dispose();
          }
        });
      });

      describeWithPermissions('Location.LocationUpdatesHandle', () => {
        t.beforeAll(async () => {
          await new LocationUpdatesHandle(BACKGROUND_LOCATION_TASK).stop();
        });

        t.afterAll(async () => {
          await new LocationUpdatesHandle(BACKGROUND_LOCATION_TASK).stop();
        });

        t.it(
          'starts and stops the delivery',
          async () => {
            const handle = new LocationUpdatesHandle(BACKGROUND_LOCATION_TASK).withProfile(
              LocationProfile.AUTOMOTIVE_NAVIGATION
            );

            await handle.start();
            t.expect(await handle.hasStarted()).toBe(true);

            await handle.stop();
            t.expect(await handle.hasStarted()).toBe(false);
          },
          TASK_TIMEOUT
        );

        if (isAndroid) {
          t.it(
            'reports the task status',
            async () => {
              const handle = new LocationUpdatesHandle(BACKGROUND_LOCATION_TASK);
              t.expect(handle.status().isRegistered).toBe(false);

              await handle.start();
              const started = handle.status();
              t.expect(started.isRegistered).toBe(true);
              t.expect(started.isRunning).toBe(true);
              t.expect(started.lastError).toBeNull();
              t.expect(started.lastFixAt === null || typeof started.lastFixAt === 'number').toBe(
                true
              );

              await handle.stop();
              t.expect(handle.status().isRegistered).toBe(false);
            },
            TASK_TIMEOUT
          );
        }
      });
    });

    describeWithPermissions('Location.watchPosition()', () => {
      t.it('toggles paused and subscribed', () => {
        const handle = watchHandle();
        try {
          handle.pause();
          t.expect(handle.status().isPaused).toBe(true);
          t.expect(handle.status().isSubscribed).toBe(false);

          t.expect(handle.resume()).toBe(true);
          const resumed = handle.status();
          t.expect(resumed.isPaused).toBe(false);
          t.expect(resumed.isSubscribed).toBe(true);
        } finally {
          handle.dispose();
        }
      });

      t.it('restarts with staged settings', () => {
        const handle = watchHandle();
        try {
          handle.withProfile(LocationProfile.LOW_POWER).withInterval(2);
          t.expect(handle.restart()).toBe(true);
          const restarted = handle.status();
          t.expect(restarted.isSubscribed).toBe(true);
          t.expect(restarted.isHandleAlive).toBe(true);
          t.expect(restarted.isPaused).toBe(false);
        } finally {
          handle.dispose();
        }
      });

      t.it('rejects an interval that is negative or not finite', () => {
        const handle = watchHandle();
        try {
          expectThrownCode(() => handle.withInterval(-1), 'ERR_INVALID_WATCH_INTERVAL');
          expectThrownCode(
            () => handle.withInterval(Number.POSITIVE_INFINITY),
            'ERR_INVALID_WATCH_INTERVAL'
          );
        } finally {
          handle.dispose();
        }
      });

      t.it('throws on a disposed handle', async () => {
        const handle = watchHandle();
        handle.dispose();
        t.expect(await TestUtils.expectMethodToThrowAsync(() => handle.status())).toBeDefined();
      });
    });

    describeWithPermissions('Location.LocationUpdatesHandle', () => {
      t.beforeAll(async () => {
        await new LocationUpdatesHandle(BACKGROUND_LOCATION_TASK).stop();
      });

      t.afterAll(async () => {
        await new LocationUpdatesHandle(BACKGROUND_LOCATION_TASK).stop();
      });

      t.it(
        'registers the profile staged before start()',
        async () => {
          const handle = new LocationUpdatesHandle(BACKGROUND_LOCATION_TASK);
          await handle.start();
          expectRegisteredProfile(await registeredLocationTask(), LocationProfile.DEFAULT);

          handle.withProfile(LocationProfile.LOW_POWER);
          expectRegisteredProfile(await registeredLocationTask(), LocationProfile.DEFAULT);

          await handle.stop();
          await handle.start();
          expectRegisteredProfile(await registeredLocationTask(), LocationProfile.LOW_POWER);
        },
        TASK_TIMEOUT
      );
    });

    describeWithPermissions('Location permission hooks', () => {
      t.it('useForegroundLocationPermissions() reports the foreground permission', async () => {
        const permission = await readHookValue(
          useForegroundPermission,
          (value) => value !== null,
          portal
        );
        expectPermissionResponse(requireNotNull(permission));
        t.expect(requireNotNull(permission).status).toBe(
          (await Location.getForegroundPermissions()).status
        );
      });

      t.it('useBackgroundLocationPermissions() reports the background permission', async () => {
        const permission = await readHookValue(
          useBackgroundPermission,
          (value) => value !== null,
          portal
        );
        expectPermissionResponse(requireNotNull(permission));
        t.expect(requireNotNull(permission).scope).toBe(
          (await Location.getBackgroundPermissions()).scope
        );
      });

      if (isAndroid) {
        t.it('useNotificationPermissions() reports the notification permission', async () => {
          const permission = await readHookValue(
            useNotificationPermission,
            (value) => value !== null,
            portal
          );
          t.expect([
            PermissionStatus.GRANTED,
            PermissionStatus.DENIED,
            PermissionStatus.UNDETERMINED,
          ]).toContain(requireNotNull(permission).status);
        });
      }
    });

    t.describe('Location.useLocationServices()', () => {
      t.it('reports the device switch and an enable function', async () => {
        const [enabled, enable] = await readHookValue(useLocationServices, () => true, portal);
        t.expect(enabled).toBe(Location.hasLocationServicesEnabled());
        t.expect(typeof enable).toBe('function');
      });
    });

    t.describe('Location.geocode()', () => {
      t.it(
        'resolves with addresses of the documented shape',
        async () => {
          const result = await geocodingOrPending(() => Location.geocode(INFINITE_LOOP.query));
          t.expect(Array.isArray(result)).toBe(true);

          const [first] = result;
          if (first == null) {
            t.pending('the geocoding backend found no match');
            return;
          }
          expectAddress(first, INFINITE_LOOP);
        },
        GEOCODING_TIMEOUT
      );

      t.it(
        'resolves with an empty array when nothing matches',
        async () => {
          const result = await geocodingOrPending(() => Location.geocode(':('));
          t.expect(result).toEqual([]);
        },
        GEOCODING_TIMEOUT
      );

      t.it(
        'varies the country name by locale',
        async () => {
          const [english] = await geocodingOrPending(() =>
            Location.geocode(VIENNA.query, { locale: 'en-US' })
          );
          const [german] = await geocodingOrPending(() =>
            Location.geocode(VIENNA.query, { locale: 'de-DE' })
          );
          if (english == null || german == null) {
            t.pending('the geocoding backend found no match');
            return;
          }
          expectAddress(english, VIENNA);
          expectAddress(german, VIENNA);
          t.expect(requireNotNull(german.country)).not.toBe(requireNotNull(english.country));
        },
        GEOCODING_TIMEOUT * 2
      );
    });

    t.describe('Location.reverseGeocode()', () => {
      t.it(
        'resolves with addresses for a known point',
        async () => {
          const result = await geocodingOrPending(() =>
            Location.reverseGeocode(HELSINKI.coordinates)
          );
          t.expect(Array.isArray(result)).toBe(true);

          const [first] = result;
          if (first == null) {
            t.pending('the geocoding backend found no match');
            return;
          }
          expectAddress(first, HELSINKI);
        },
        GEOCODING_TIMEOUT
      );

      t.it('rejects coordinates outside the valid range', async () => {
        await expectRejectionCode(
          () => Location.reverseGeocode({ latitude: 91, longitude: 0 }),
          'ERR_INVALID_COORDINATES'
        );
        await expectRejectionCode(
          () => Location.reverseGeocode({ latitude: 0, longitude: 181 }),
          'ERR_INVALID_COORDINATES'
        );
      });

      t.it('rejects coordinates that are not numbers', async () => {
        const error = await TestUtils.expectMethodToThrowAsync(() =>
          Location.reverseGeocode({ latitude: '60', longitude: '24' } as unknown as Coordinates)
        );
        t.expect(error).toBeDefined();
      });
    });

    t.describe('Location.defineLocationTask()', () => {
      t.it('defines the task', () => {
        t.expect(TaskManager.isTaskDefined(BACKGROUND_LOCATION_TASK)).toBe(true);
      });
    });

    if (isAndroid) {
      t.describe('Location providers', () => {
        t.afterEach(() => selectDefaultProvider());

        t.it('selects the fallback chain by default', () => {
          t.expect(Location.getSelectedLocationProviderName()).toBe('Fallback: GMS -> Android');
        });

        t.it('selects the Google Play services provider', () => {
          Location.setLocationProvider(LocationProvider.Gms());
          t.expect(Location.getSelectedLocationProviderName()).toBe('GMS');
        });

        t.it('selects the Android framework provider', () => {
          Location.setLocationProvider(LocationProvider.Android());
          t.expect(Location.getSelectedLocationProviderName()).toBe('Android');
        });

        t.it('names the whole chain of a fallback provider', () => {
          Location.setLocationProvider(
            LocationProvider.Fallback([LocationProvider.Android(), LocationProvider.Gms()])
          );
          t.expect(Location.getSelectedLocationProviderName()).toBe('Fallback: Android -> GMS');
        });
      });

      describeWithPermissions('Location background session', () => {
        const needsForegroundService = Number(Platform.Version) >= ANDROID_O;

        t.beforeAll(async () => {
          await Location.stopBackgroundSession();
          await waitForBackgroundSessionState(BackgroundSessionState.NOT_RUNNING);
        }, SESSION_TIMEOUT * 2);

        t.afterAll(async () => {
          await Location.stopBackgroundSession();
        });

        t.it('reports no session before one is started', () => {
          const status = Location.getBackgroundSessionStatus();
          t.expect(status.state).toBe(BackgroundSessionState.NOT_RUNNING);
          t.expect(status.stopOnTaskRemoved).toBe(false);
          t.expect(status.unthrottled).toBe(!needsForegroundService);
        });

        t.it(
          'promotes the foreground service',
          async () => {
            await Location.ensureBackgroundSessionStarted({
              notificationTitle: 'test-suite',
              notificationBody: 'Background location session',
              notificationColor: 0x2196f3,
              stopOnTaskRemoved: true,
            });

            const status = Location.getBackgroundSessionStatus();
            t.expect(status.unthrottled).toBe(true);
            if (!needsForegroundService) {
              t.expect(status.state).toBe(BackgroundSessionState.NOT_RUNNING);
              return;
            }
            t.expect(status.state).toBe(BackgroundSessionState.PROMOTED);
            t.expect(status.stopOnTaskRemoved).toBe(true);
          },
          SESSION_TIMEOUT
        );

        t.it(
          'stops the foreground service',
          async () => {
            await Location.stopBackgroundSession();

            const status = await waitForBackgroundSessionState(BackgroundSessionState.NOT_RUNNING);
            t.expect(status.state).toBe(BackgroundSessionState.NOT_RUNNING);
            t.expect(status.stopOnTaskRemoved).toBe(false);
            t.expect(status.unthrottled).toBe(!needsForegroundService);
          },
          SESSION_TIMEOUT * 2
        );
      });
    }
  });
}
