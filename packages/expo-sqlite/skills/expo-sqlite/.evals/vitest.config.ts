// Plain object on purpose: importing 'vitest/config' would need a local
// node_modules, but these evals run via `npx -y vitest run` with no install.
// (Test files may import 'vitest' — the runtime aliases that to itself.)
export default {
  resolve: {
    alias: {
      // In-repo: resolve the private kit from source (vite-node compiles TS
      // directly, no build step). When @expo/skill-eval-kit publishes, delete
      // this alias and declare the dependency — case files don't change.
      '@expo/skill-eval-kit': __dirname + '/../../../../@expo/skill-eval-kit/src/index.ts',
    },
  },
  test: {
    include: ['**/*.eval.ts'],
    // Assertions are fast; the beforeAll agent run sets its own hook timeout.
    testTimeout: 60_000,
  },
};
