/**
 * Extracts the native shared object ID from a SharedObject instance.
 * Used internally to pass SharedObject references as view props.
 */
export function getStateId(state?: object | null): number | null {
  if (!state) {
    return null;
  }
  return (state as { __expo_shared_object_id__?: number }).__expo_shared_object_id__ ?? null;
}
