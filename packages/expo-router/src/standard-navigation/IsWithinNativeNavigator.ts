import { createContext } from 'react';

/**
 * Indicates that descendants are rendered inside a native navigator.
 * Native navigator integrations should provide `true` so incompatible nested navigators can fail
 * before reaching the native view hierarchy.
 */
export const IsWithinNativeNavigator = createContext(false);
