import { noDynamicEnvVar } from './noDynamicEnvVar';
import { noEnvVarDestructuring } from './noEnvVarDestructuring';
import { useDomExports } from './use-dom-exports';

export const rules = {
  'no-dynamic-env-var': noDynamicEnvVar,
  'no-env-var-destructuring': noEnvVarDestructuring,
  'use-dom-exports': useDomExports,
};
