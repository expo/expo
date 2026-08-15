import { createContext } from 'react';

/**
 * Context to indicate if native menu in toolbar or link preview can be used.
 */
export const NativeMenuContext = createContext<boolean>(false);
