import { SpawnPromise, SpawnResult } from '@expo/spawn-async';

/** The shared spawn child object, used to assert resolve values in tests */
export const STUB_SPAWN_CHILD = { type: 'child' };
/** The shared spawn result object, used to assert resolve values in tests */
export const STUB_SPAWN_RESULT = { type: 'spawn' };

/**
 * Mock a spawn promise by adding a `child` property to the provided promise.
 * If nothing is provided, it defaults to a promise resolving the spawn result stub.
 * Note, this is used inside the root mock for `@expo/spawn-async`.
 */
export function mockSpawnPromise(
  promise: Promise<any> = Promise.resolve(STUB_SPAWN_RESULT),
  child: any = STUB_SPAWN_CHILD
): SpawnPromise<SpawnResult> {
  // @ts-expect-error We are modifying the promise, typescript doesnt know how to type it
  promise.child = child;
  return promise as SpawnPromise<SpawnResult>;
}
