import { defaultLoaderContextValue } from './LoaderContext';

/**
 * Clears a failed `loader` result, so that the next `useLoaderData()` call fetches the data again.
 *
 * A failed `loader` result stays cached until the user leaves the route. The `retry` function
 * of a route's `ErrorBoundary` export clears it. Call this function before you reset your own
 * error boundary.
 *
 * @param error The error that your error boundary caught.
 *
 * @example
 * ```tsx
 * import { clearLoaderError } from 'expo-router';
 *
 * function Fallback({ error, reset }: { error: Error; reset: () => void }) {
 *   return (
 *     <Button
 *       title="Retry"
 *       onPress={() => {
 *         clearLoaderError(error);
 *         reset();
 *       }}
 *     />
 *   );
 * }
 * ```
 */
export function clearLoaderError(error: unknown): void {
  defaultLoaderContextValue.store.clearError(error);
}
