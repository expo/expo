# Step 1, round 9 — cover the disagreeing shape, and name what is covered

Three small items closing step 1. Round 8 was APPROVED by both reviewers; these are the
should-fix remainder. **Do not change any behaviour.** Item 1 adds a test, items 2 and 3
fix a name and a comment. If any item appears to require a behaviour change, stop and
report — it does not.

**Files you may change:** `tools/src/prebuilds/CheckedInManifest.test.ts` and
`tools/src/prebuilds/CheckedInManifest.ts` (comment text only, item 3). Anything else:
stop and report.

⚠ Another agent is working concurrently in this same worktree on different files:
`tools/src/commands/PrebuildEquivalence.*`, `tools/src/prebuilds/equivalence/**`,
`tools/src/prebuilds/SpmManifestCollateral.test.ts`,
`tools/src/prebuilds/SwiftInterfaceChecks.ts`, `tools/scripts/`. Do not read those as
your own state and never edit them. Report, do not fix, if you see them failing.

---

## Item 1 (MUST) — the `node_modules` exclusion is the sole guard for a shape no test covers

`isFirstPartyPackagePath` (`CheckedInManifest.ts:60-66`) computes
`path.relative(packagesRoot, packagePath)` and inspects only the RELATIVE parts. So when
the packages root is itself inside a dependency tree, containment PASSES:

- `packagesRoot = /repo/node_modules/expo/packages`
- candidate   = `/repo/node_modules/expo/packages/fixture`
- relative    = `fixture` — no `..`, no `node_modules`, depth 1 → containment passes.

Only the absolute-path `node_modules` exclusion at `:100` rejects it. That line is
load-bearing and is the **sole** guard for this shape. A previous fault injection deleted
the line and the suite stayed green, because no test uses a packages root inside
`node_modules`. This is a coverage gap, not a behaviour bug — rejecting is correct, since
it falls back to Mode A, which is the safe direction.

**Required:** add a test using exactly that shape — a packages root inside `node_modules`
with a candidate one directory under it — asserting the path is rejected.

**Then verify by injection:** delete the exclusion line at `:100`, confirm this new test
goes red, restore the line, and confirm the tree is byte-identical to how you found it.
Report which tests went red and which stayed green.

## Item 2 (MUST) — a test name that overstates its coverage

`CheckedInManifest.test.ts:937` is named `review 11 resolves a package reached through a
symlink…`, but its fixture uses only a lexical `..` with **no symlink at all**. Round 8
added real-symlink tests alongside it and left this name in place.

Rename it to state what it actually covers. A name that overstates coverage is how a
future reader concludes a case is tested when it is not — the same defect class this
project keeps hitting. Do not change the test body or its assertions.

## Item 3 (MUST) — an unclear comment

`CheckedInManifest.ts:110` says "one directory under it". "It" is ambiguous. Name
`${packagesRoot}` directly so the sentence stands alone. Comment text only — no code
change on this line.

---

## Constraints

- TypeScript: no `any`.
- **Red before green on item 1**, reported with counts. Revert the injection and verify
  the revert.
- **A failed `pnpm build` in `tools/` leaves the previous `build/` output in place**, and
  `node --test` then reports green against stale sources. Print and check the build exit
  status every time. This has produced false greens in four rounds of this work.
- A run that collects zero tests and exits 0 is not green. State suite and test counts.
- `et` resolves `EXPO_ROOT_DIR`, not the working directory. Export it to this worktree.
- Run no git command that changes state — no `checkout`, `stash`, `restore`, `reset`,
  `clean`, `commit` or `push`. Read-only git is fine.

## Report (concise, structured, agent-to-agent)

1. Item 1: the red run (which test, which counts), the injection result — which tests went
   red, which stayed green — and confirmation the revert restored the tree.
2. Items 2 and 3: the old and new text, one line each.
3. Green evidence: targeted and full runs, suite and test counts, build exit status.
4. `tsc` and `eslint --max-warnings 0` results.
5. Anything you could not do, and why.
