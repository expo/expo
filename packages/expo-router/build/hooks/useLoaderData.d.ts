import type { LoaderFunction } from 'expo-server';
type LoaderFunctionResult<T extends LoaderFunction<any>> = T extends LoaderFunction<infer R> ? R : unknown;
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
export declare function useLoaderData<T extends LoaderFunction<any> = any>(): LoaderFunctionResult<T>;
export {};
//# sourceMappingURL=useLoaderData.d.ts.map