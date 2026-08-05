// Augment `@types/babel__core` with APIs missing from the @types package
import type { PartialConfig, TransformOptions } from '@babel/core';

declare module '@babel/core' {
  export function loadPartialConfigSync(options?: TransformOptions): Readonly<PartialConfig> | null;

  export interface PartialConfig {
    /** Set of all config file paths resolved during config loading */
    files: Set<string>;
  }
}
