/**
 * Package-specific eval setup — the one file that knows this is expo-sqlite.
 * Case files import `agentEval` from here, so when eval-kit.ts moves to a
 * shared package, only the import below changes; case files stay untouched.
 */
import { createAgentEval } from './eval-kit';

export { expect, loadAstSupport, type EvalWorkspace } from './eval-kit';

export const agentEval = createAgentEval({
  packageName: 'expo-sqlite',
  packageRoot: new URL('../../..', import.meta.url),
  skillDir: new URL('..', import.meta.url),
  fixturesDir: new URL('./fixtures', import.meta.url),
  baseTemplate: 'blank-typescript',
});
