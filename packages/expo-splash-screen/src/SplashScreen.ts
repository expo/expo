import ExpoSplashScreen from './ExpoSplashScreen';
import { SampleOptions } from './SplashScreen.types';


export * from './SplashScreen.types';

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
  return await ExpoSplashScreen.someGreatMethodAsync(options);
}
