import { defineLocationTask, Location, LocationProvider, type Position } from 'expo-location/next';
import { Platform } from 'react-native';

import type { JasmineInterface } from '../types';

export const BACKGROUND_LOCATION_TASK = 'next-background-location-updates';
export const POSITION_TIMEOUT = 17000;
export const PERMISSION_TIMEOUT = 5000;
export const TASK_TIMEOUT = 3000;
const EARLIEST_FIX_TIMESTAMP = Date.UTC(2000, 0, 1);
const CLOCK_SKEW_TOLERANCE = 60000;

const isAndroid = Platform.OS === 'android';

type PositionDeferred = { resolve: (position: Position) => void };

let pendingTaskPosition: PositionDeferred | null = null;
let lastTaskError: string | null = null;

export function nextTaskPosition(timeoutMs: number): Promise<Position> {
  lastTaskError = null;
  const deferred: PositionDeferred = { resolve: () => {} };
  pendingTaskPosition = deferred;
  return new Promise<Position>((resolve, reject) => {
    const timer = setTimeout(() => {
      if (pendingTaskPosition === deferred) {
        pendingTaskPosition = null;
      }
      const lastError = lastTaskError === null ? '' : `, last task error: ${lastTaskError}`;
      reject(new Error(`the task received no position within ${timeoutMs} ms${lastError}`));
    }, timeoutMs);
    deferred.resolve = (position) => {
      clearTimeout(timer);
      if (pendingTaskPosition === deferred) {
        pendingTaskPosition = null;
      }
      resolve(position);
    };
  });
}

export function expectPosition(t: JasmineInterface, position: Position) {
  const now = Date.now();
  t.expect(typeof position.coordinates.latitude).toBe('number');
  t.expect(typeof position.coordinates.longitude).toBe('number');
  t.expect(position.coordinates.latitude).toBeGreaterThanOrEqual(-90);
  t.expect(position.coordinates.latitude).toBeLessThanOrEqual(90);
  t.expect(position.coordinates.longitude).toBeGreaterThanOrEqual(-180);
  t.expect(position.coordinates.longitude).toBeLessThanOrEqual(180);
  t.expect(typeof position.timestamp).toBe('number');
  t.expect(position.timestamp).toBeGreaterThanOrEqual(EARLIEST_FIX_TIMESTAMP);
  t.expect(position.timestamp).toBeLessThanOrEqual(now + CLOCK_SKEW_TOLERANCE);
  t.expect(typeof position.mocked).toBe('boolean');

  const nullableFields = [
    'horizontalAccuracy',
    'altitude',
    'mslAltitude',
    'verticalAccuracy',
    'heading',
    'headingAccuracy',
    'speed',
    'speedAccuracy',
  ] as const;
  for (const field of nullableFields) {
    const value = position[field];
    t.expect(value === null || typeof value === 'number').toBe(true);
  }

  const nonNegativeFields = [
    'horizontalAccuracy',
    'verticalAccuracy',
    'headingAccuracy',
    'speed',
    'speedAccuracy',
  ] as const;
  for (const field of nonNegativeFields) {
    const value = position[field];
    t.expect(value === null || value >= 0).toBe(true);
  }
  t.expect(position.heading === null || (position.heading >= 0 && position.heading <= 360)).toBe(
    true
  );
}

export function selectDefaultProvider() {
  Location.setLocationProvider(
    LocationProvider.Fallback([LocationProvider.Gms(), LocationProvider.Android()])
  );
}

const providerPasses = [
  {
    label: 'the Android framework provider',
    select: () => Location.setLocationProvider(LocationProvider.Android()),
  },
  {
    label: 'the default fallback provider',
    select: selectDefaultProvider,
  },
];

export function describeForEachProvider(t: JasmineInterface, define: () => void) {
  if (!isAndroid) {
    define();
    return;
  }
  for (const pass of providerPasses) {
    t.describe(`with ${pass.label}`, () => {
      t.beforeAll(() => pass.select());
      t.afterAll(() => selectDefaultProvider());

      define();
    });
  }
}

defineLocationTask({
  taskName: BACKGROUND_LOCATION_TASK,
  onPosition: (position) => pendingTaskPosition?.resolve(position),
  onError: (error) => {
    lastTaskError = `${error.code}: ${error.message}`;
  },
});
