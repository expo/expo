'use client';

import type { LoaderFunction } from 'expo-server';
import { use, useEffect, useState } from 'react';

import { useLoaderTarget } from './useLoaderTarget';

type LoaderFunctionResult<T extends LoaderFunction<any>> =
  T extends LoaderFunction<infer R> ? R : unknown;

/**
 * Returns the result of the `loader` function for the calling route.
 *
 * @example
 * ```tsx app/profile/[user].tsx
 * import { Text } from 'react-native';
 * import { useLoaderData } from 'expo-router';
 *
 * export function loader() {
 *   return Promise.resolve({ foo: 'bar' }};
 * }
 *
 * export default function Route() {
 *  const data = useLoaderData<typeof loader>(); // { foo: 'bar' }
 *
 *  return <Text>Data: {JSON.stringify(data)}</Text>;
 * }
 */
export function useLoaderData<T extends LoaderFunction<any> = any>(): LoaderFunctionResult<T> {
  const { runtime, serverData, owner, path } = useLoaderTarget();
  const [, setVersion] = useState(0);
  const read = serverData ? undefined : runtime.read<LoaderFunctionResult<T>>(owner, path);

  useEffect(() => {
    return read ? runtime.attach(read, () => setVersion((version) => version + 1)) : undefined;
    // The snapshot detects a result missed before attachment. Entry updates must not
    // recreate the observer; only a change of owner, path, or rendering source does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runtime, owner, path, !!serverData]);

  if (serverData) return serverData[path];
  // Suspense replay must still call use() after settlement. get() then checks the current
  // generation because React may have reused a wakeable from an earlier canceled request.
  use(read!.ready);
  return read!.get();
}
