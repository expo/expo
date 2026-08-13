import type { PreflightTransforms } from 'noxcturnal';

export interface ProfilePreflightFacts {
  hasAsync: boolean;
  hasAsyncGenerator: boolean;
  hasBlockScopedDeclaration: boolean;
  hasClass: boolean;
  hasForOf: boolean;
  hasPrivateSyntax: boolean;
  hasRegexpLiteral: boolean;
  hasStaticBlock: boolean;
}

export type ProfilePreflightConfig = PreflightTransforms;
