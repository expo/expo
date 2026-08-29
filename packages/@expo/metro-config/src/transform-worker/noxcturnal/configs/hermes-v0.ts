import type { ProfilePreflightConfig, ProfilePreflightFacts } from './types';

export function getHermesV0PreflightConfig(facts: ProfilePreflightFacts): ProfilePreflightConfig {
  return {
    blockScoping: facts.hasBlockScopedDeclaration,
    classProperties: facts.hasClass ? { loose: true } : undefined,
    classStaticBlock: facts.hasStaticBlock,
    privateMethods: facts.hasClass,
    privatePropertyInObject: facts.hasClass,
    regexpUnicode: facts.hasRegexpLiteral,
    classes: facts.hasClass,
    regexpNamedCaptureGroups: facts.hasRegexpLiteral,
    destructuring: true,
    asyncGeneratorFunctions: facts.hasAsyncGenerator,
    asyncFunctions: facts.hasAsync,
    objectRestSpread: facts.hasSpread ? { loose: true, useBuiltIns: true } : undefined,
    parameters: true,
  };
}
