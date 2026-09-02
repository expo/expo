import type { ProfilePreflightConfig, ProfilePreflightFacts } from './types';

export function getWebPreflightConfig(facts: ProfilePreflightFacts): ProfilePreflightConfig {
  return {
    classStaticBlock: facts.hasStaticBlock,
    privateMethods: facts.hasPrivateSyntax,
    privatePropertyInObject: facts.hasPrivateSyntax,
  };
}
