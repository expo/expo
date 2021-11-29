import { SampleOptions } from './DevClientComponents.types';
import ExpoDevClientComponents from './ExpoDevClientComponents';

export * from './DevClientComponents.types';

/**
 * Great method that does a lot great stuff.
 * @param options specifies what great stuff you really want.
 *
 * @example
 * ```typescript
 * const result = await someGreatMethodAsync({ someOption: 'awesome' });
 * ```
 */
export async function someGreatMethodAsync(options: SampleOptions) {
  return await ExpoDevClientComponents.someGreatMethodAsync(options);
}
