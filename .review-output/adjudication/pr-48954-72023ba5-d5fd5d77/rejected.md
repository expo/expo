# Rejected, resolved, and non-finding claims

- **“The package tests do not run in PR CI” — refuted.** The SDK pull-request job runs affected package `build`, `typecheck`, and `test` tasks on Ubuntu. Successful test output is suppressed by Turbo.
- **Reviewed-head formatting failure — resolved.** `72023ba5` failed `oxfmt`; current head `da565715` contains only the required import reorder and its `check-packages` job succeeded.
- **Ignored directories regress — refuted.** The ignore predicate still returns before watch creation and descent; a base/head watch-set comparison was identical.
- **Regular files are duplicated by read/watch overlap — refuted.** Both observations pass through registration and the same keyed debounce.
- **Missing extra guardrail tests are correctness findings — rejected.** Deterministic ordering, ignored-directory, nested-directory, and package-manager-pattern tests would improve confidence but their absence alone does not establish a defect.
- **The explanatory comment is too long — style only.** No concrete maintenance or correctness consequence was established.
- **The fix must be upstreamed here — out of scope.** Upstreaming is worthwhile follow-up work, not a defect in this PR.
- **Queue overflow is a regression — pre-existing/out of scope.** It needs recrawl or reconciliation above the watcher.
- **The misleading `ExpoAsset` error is a regression — out of scope.** It is a separate diagnostic-layer problem.
- **`TreeFS` negative misses changed — refuted.** `TreeFS.ts` and its tests have no base/head diff.
- **The exact issue workflow is proven by the new test — refuted as evidence, not promoted to a bug.** The automated test covers the watcher mechanism; current-design manual evidence used direct `bun add`, not the literal `npx expo install` path.
- **The real-filesystem test is a portable red/green test — refuted.** It passed against both base and head on macOS; Ubuntu CI still covers the intended inotify behavior.
