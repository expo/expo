import UnimodulesAppLoader from './UnimodulesAppLoader';
import { SampleOptions } from './Unimodule.types';


export * from './Unimodule.types';

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
  return await UnimodulesAppLoader.someGreatMethodAsync(options);
}
