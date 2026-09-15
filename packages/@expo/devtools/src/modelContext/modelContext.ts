import { getConnectionInfo } from '../getConnectionInfo';
import type { ModelContext } from './ModelContext.types';
import { ModelContextClient, noopModelContext } from './ModelContextClient';

const isProduction = typeof process !== 'undefined' && process.env?.NODE_ENV === 'production';

/**
 * The app's model context. Register tools here so an agent connected to the Expo dev server can
 * call them. Development only: in production every method is a no-op.
 */
export const modelContext: ModelContext = isProduction
  ? noopModelContext
  : new ModelContextClient({
      getConnectionInfo,
      platform: typeof process !== 'undefined' ? process.env?.EXPO_OS : undefined,
    });
