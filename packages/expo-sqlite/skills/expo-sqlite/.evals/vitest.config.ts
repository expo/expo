// Plain object on purpose: importing 'vitest/config' would need a local
// node_modules, but these evals run via `npx -y vitest run` with no install.
// (Test files may import 'vitest' — the runtime aliases that to itself.)
export default {
  test: {
    include: ['**/*.eval.ts'],
    // Assertions are fast; the beforeAll agent run sets its own hook timeout.
    testTimeout: 60_000,
  },
};
