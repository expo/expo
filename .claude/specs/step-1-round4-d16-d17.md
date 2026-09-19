# Step 1, round 4 — apply D16 and D17

Amendment to `.claude/specs/step-1-mode-b.md`. Two items only. Round 3 applied 6 of 8
items; these two were decided but never written to the code.

Files you may change — **these two and nothing else**:

- `tools/src/prebuilds/CheckedInManifest.ts`
- `tools/src/prebuilds/CheckedInManifest.test.ts`

If a third file must change, stop and report instead of changing it.

## Item 1 (D17) — remove the `process.platform` lowercase compare

`hasCheckedInManifest` decides whether a package opts in to Mode B. Today it lowercases
both sides on darwin:

```ts
const canonical = (value: string) => {
  const resolved = fs.realpathSync(value);
  return process.platform === 'darwin' ? resolved.toLowerCase() : resolved;
};
```

That is wrong: a case-sensitive APFS volume on macOS holds `PACKAGES` and `packages` as
two genuinely different directories, and this compare equates them. The earlier spec asked
for it; the spec was wrong.

**Required behaviour.** Mode B is enabled only for a package that physically lives directly
under the repo `packages/` directory — one level down, or two levels when the first is an
`@scope` directory — and that ships a `Package.swift`.

- Decide containment on canonical paths: `fs.realpathSync` both `getPackagesDir()` and
  `pkg.path`, then `path.relative`. Reject when the result is empty, is absolute, contains
  a `..` segment, or contains a `node_modules` segment.
- **No branch on `process.platform`.**
- Keep the existing `isExternalPackage` check and the explicit `node_modules` exclusion
  (D18, already landed at lines 54 and 60-63). Do not remove them.

**Empirical step you must run before choosing the implementation.** D17 rests on an
unverified assumption: that `fs.realpathSync` returns the on-disk canonical casing when
given a path typed with the wrong case. Verify it on this machine — for example, call
`fs.realpathSync` on the repo `packages` directory spelled `PACKAGES` and print the result.
Put the exact command and its exact output in your report.

- If realpath **does** canonicalize casing: a plain case-sensitive compare is correct and
  sufficient. Nothing further is needed.
- If it **does not**: detect the *volume's* actual case sensitivity at runtime and compare
  case-insensitively only when the volume is genuinely case-insensitive. Probe the volume
  that holds `getPackagesDir()`, not the platform. Cache the probe per resolved root so the
  check is not repeated for every package.

**Tests for item 1** (red before green):

1. The existing `review 3 recognizes PACKAGES on a case-insensitive filesystem` must still
   pass. Leave its `skip` condition as it is.
2. Factor the containment decision into a pure function that takes the packages root, the
   candidate path, and whether the volume is case sensitive, then test **both polarities**.
   A case-sensitive volume must treat `PACKAGES/fixture` and `packages/fixture` as different
   directories. We cannot mount such a volume, so the polarity is supplied to the pure
   function rather than discovered.
3. The worst failure mode in this change is a migrated first-party package silently falling
   back to Mode A, because nothing downstream notices. Assert that a legitimate first-party
   package carrying `Package.swift` returns `true`. If such a test already exists, leave it
   alone and say so.

## Item 2 (D16) — rewrite the three unreachable guard tests

The loop at `CheckedInManifest.test.ts:815-827` asserts that `prefixSourcePath` rejects
absolute paths for four manifest rules. Three of them — `sources`, `exclude`, `resources` —
fail, because `swift package dump-package` rejects such a manifest before our guard at
`CheckedInManifest.ts:182` ever runs. These three failures are the current red.

The guard is correct and is defence in depth. It is genuinely reachable for
`publicHeadersPath`, which is already proved. So split the coverage:

- Keep `publicHeadersPath` in the integration loop.
- Add **unit** tests that reach the guard directly for all four rules, driven by a synthetic
  `dump-package` JSON result rather than by real Swift. The file already contains a PATH-shim
  pattern in `failFirstSwiftDump` — reuse that shape to emit deterministic crafted JSON, or
  inject the dump result if the resolver already allows it. Do not invent a third mechanism
  unless neither works; if neither works, report that instead of forcing it.
- Add **exactly one** integration test asserting the real behaviour: an absolute `sources`
  entry is rejected by Swift itself, surfaced through our dump-failure error. Its name and a
  short comment must record that the guard is defence in depth and is covered by the unit
  tests, so a later reader does not delete the guard as dead code.

**Delete nothing.** No test may assert something that is not true.

## Constraints

- TypeScript: no `any`.
- `et` resolves `EXPO_ROOT_DIR`, not the working directory. Every command must act on this
  worktree, not the main checkout.
- Confirm a **non-zero** suite and test count in every run. A zero-test run that exits 0 is
  not green.
- You are the only agent running. Build and test from `tools/` in this worktree:
  `pnpm build` then `node --test build/prebuilds/CheckedInManifest.test.js`, and the full
  `node --test 'build/**/*.test.js'` at the end.

## Report (concise, structured)

1. Red evidence: the failing run before your change, with counts.
2. Green evidence: the passing run after, with suite and test counts.
3. The realpath casing experiment: exact command, exact output, which D17 branch you took
   and why.
4. Tests added, by name.
5. `tsc` result and `eslint --max-warnings 0` result for the two files.
6. Anything you could not do, and why.
