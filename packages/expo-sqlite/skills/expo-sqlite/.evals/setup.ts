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
  async prepareWorkspaceAsync({ runAsync }) {
    // Realistic dependency resolution + node_modules per workspace (enables
    // install-dependent checks). Off by default: it hits the network for
    // every case × condition. The kit re-points expo-sqlite at this checkout
    // afterwards, so the published install never replaces the code under test.
    if (process.env.EXPO_SKILL_EVAL_INSTALL === '1') {
      // `expo install` resolves the SDK-compatible version, but needs the
      // project's own `expo` module installed first.
      await runAsync('npm', ['install', '--no-audit', '--no-fund']);
      await runAsync('npx', ['expo', 'install', 'expo-sqlite']);
    }
  },
});
