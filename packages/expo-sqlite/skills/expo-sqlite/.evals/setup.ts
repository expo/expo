/**
 * Package-specific eval setup — the one file that knows this is expo-sqlite.
 * It deliberately imports nothing from eval-kit.ts: `setupProject()` returns
 * a plain descriptor (structurally matching the kit's `ProjectSetup`) that
 * case files pass to `agentEval` as `projectSetup`. Pure config stays
 * portable when the kit moves to a shared package.
 */

export interface ProjectSetupOptions {
  /** Named fixture directory(ies) under fixtures/, layered over the base scaffold. */
  fixture?: string | string[];
  /** Extra package.json dependencies merged into the scaffold's. */
  dependencies?: Record<string, string>;
  /** One-off files written over the fixtures, workspace-relative path → contents. */
  files?: Record<string, string>;
}

/** Builds one case's project descriptor: expo-sqlite package facts + the case's starting state. */
export function setupProject(options: ProjectSetupOptions = {}) {
  return {
    packageName: 'expo-sqlite',
    packageRoot: new URL('../../..', import.meta.url),
    skillDir: new URL('..', import.meta.url),
    fixturesDir: new URL('./fixtures', import.meta.url),
    baseTemplate: 'blank-typescript',
    async prepareAsync({
      runAsync,
    }: {
      runAsync: (command: string, args: string[]) => Promise<void>;
    }) {
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
    ...options,
  };
}
