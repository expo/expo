import { noDynamicEnvVar } from './no-dynamic-env-var';
import { noEnvVarDestructuring } from './no-env-var-destructuring';
import { noSensitivePublicEnvVar } from './no-sensitive-public-env-var';
import { preferBoxShadow } from './prefer-box-shadow';
import { useDomExports } from './use-dom-exports';

export const rules = {
  'no-dynamic-env-var': noDynamicEnvVar,
  'no-env-var-destructuring': noEnvVarDestructuring,
  'no-sensitive-public-env-var': noSensitivePublicEnvVar,
  'prefer-box-shadow': preferBoxShadow,
  'use-dom-exports': useDomExports,
};
