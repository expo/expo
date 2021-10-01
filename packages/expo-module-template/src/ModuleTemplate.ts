import ExpoModuleTemplate from './ExpoModuleTemplate';
import { SampleOptions } from './ModuleTemplate.types';

export {
  default as ExpoModuleTemplateView,
  ExpoModuleTemplateViewProps,
} from './ExpoModuleTemplateView';

export * from './ModuleTemplate.types';

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
  return await ExpoModuleTemplate.someGreatMethodAsync(options);
}
