import type { ProfilePreflightConfig, ProfilePreflightFacts } from './types';

export function getWebViewPreflightConfig(facts: ProfilePreflightFacts): ProfilePreflightConfig {
  return {
    blockScoping: facts.hasBlockScopedDeclaration,
    classProperties: facts.hasClass ? { loose: true } : undefined,
    classStaticBlock: facts.hasStaticBlock,
    classes: facts.hasClass,
    privateMethods: facts.hasClass,
    privatePropertyInObject: facts.hasClass,
    regexpUnicode: facts.hasRegexpLiteral,
    regexpNamedCaptureGroups: facts.hasRegexpLiteral,
    destructuring: true,
    asyncGeneratorFunctions: facts.hasAsyncGenerator,
    asyncFunctions: facts.hasAsync,
    forOf: facts.hasForOf,
    parameters: true,
    optionalCatchBinding: true,
    optionalChaining: { loose: true },
    nullishCoalescingOperator: { loose: true },
    logicalAssignmentOperators: true,
    objectRestSpread: facts.hasSpread ? { loose: true, useBuiltIns: true } : undefined,
  };
}
