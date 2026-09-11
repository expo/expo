import type { ProfilePreflightConfig, ProfilePreflightFacts } from './types';

export function getHermesV1PreflightConfig(facts: ProfilePreflightFacts): ProfilePreflightConfig {
  return {
    blockScoping: facts.hasBlockScopedDeclaration,
    classStaticBlock: facts.hasStaticBlock,
    asyncGeneratorFunctions: facts.hasAsyncGenerator,
  };
}
