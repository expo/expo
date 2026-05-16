import type { EntriesDev } from '../server';

import { createPages } from './expo-definedRouter';

// Used in client-only mode to skip route loading in react-server bundles.
export default (_getRouteOptions?: unknown): EntriesDev => ({
  default: createPages(async () => {}),
});
