# Recorded `@expo/fingerprint` payloads

Ground truth for `src/project/localDiff.ts`, which reproduces `fingerprint:diff` **in process** so
that `@expo/agent-cli status` can classify a change without spawning anything (llp/0004 §Status
is free, the explanation is not).

**Provenance.** Recorded 2026-08-26 against `apps/observe-tester` with the project's own
`@expo/fingerprint` CLI. `fingerprint:generate` produced a real 210-source fingerprint; twelve of
those sources — four `file`, three `dir`, two `contents`, three `package`, which is every type the
sourcer emits — became `diff-base.json`. `diff-head.json` is that list with one `file` removed, one
`dir`'s hash changed, one `package` version bumped, and one more real `dir` added, re-sorted the way
the CLI emits sources. `diff-items.json` is what the **real** `fingerprint:diff` printed for that
pair, verbatim.

Only one edit: `contents` sources keep the first 60 characters of their `contents` field. It is
unbounded in the real payload (one entry was several kilobytes of autolinking JSON) and nothing
reads it — the diff compares `hash`, and the identity of a `contents` source is its `id`.

| File | What it pins |
| --- | --- |
| `diff-base.json` | One side of the comparison, in the `{hash, sources}` shape `fingerprint:generate` prints and `.expo/agent-cli-last-build.json` stores. |
| `diff-head.json` | The other side. |
| `diff-items.json` | The five items the real CLI produced. **A `package` whose version moved is `removed` + `added`, not `changed`** — a package's identity is `name@version` — which is the one rule a local reimplementation would most plausibly get wrong. |
