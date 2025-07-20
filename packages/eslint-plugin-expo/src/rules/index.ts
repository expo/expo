import { noDynamicEnvVar } from './noDynamicEnvVar';
import { noEnvVarDestructuring } from './noEnvVarDestructuring';
import { preferBoxShadow } from './prefer-box-shadow';
import { useDomExports } from './use-dom-exports';

export const rules = {
  'no-dynamic-env-var': noDynamicEnvVar,
  'no-env-var-destructuring': noEnvVarDestructuring,
  'prefer-box-shadow': preferBoxShadow,
  'use-dom-exports': useDomExports,
};
