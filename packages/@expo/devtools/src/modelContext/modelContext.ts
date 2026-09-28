import { getConnectionInfo } from '../getConnectionInfo';
import type { ModelContext } from './ModelContext.types';
import { ModelContextClient, noopModelContext } from './ModelContextClient';

declare const __DEV__: boolean | undefined;

/**
 * The app's model context. Register tools here so an agent connected to the Expo dev server can
 * call them. Only active when `__DEV__` is true: otherwise every method is a no-op.
 */
export const modelContext: ModelContext =
  typeof __DEV__ !== 'undefined' && __DEV__
    ? new ModelContextClient({ getConnectionInfo })
    : noopModelContext;
