import { BuildFlavor } from './Prebuilder.types';
import { SPMProduct } from './SPMConfig.types';

/**
 * Defines a type representing a built framework with its symbols bundle path and framework path.
 */
export type BuiltFramework = {
  /** The product associated with the built framework. */
  product: SPMProduct;
  /** The path to the symbols bundle of the built framework. */
  symbolsBundlePath: string;
  /** The path to the built framework. */
  frameworkPath: string;
  /** Build-type */
  buildType: BuildFlavor;
};
