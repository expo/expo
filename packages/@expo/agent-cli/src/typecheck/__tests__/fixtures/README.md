<!-- @ref llp/0002-testing-and-evals.plan.md -->

# Recorded `tsc` output

Both files are one run of **the same project in the same state**, printed two ways. That is the
point of recording both: `--pretty` is a compiler option as well as a flag, so a project can turn
it on in its `tsconfig.json`, and a parser that only knew the terse form would report "no errors"
for a project whose compiler printed the other one — the one answer a gate must never give.

| File              | Command                            |
| ----------------- | ---------------------------------- |
| `tsc-terse.txt`   | `tsc --noEmit --pretty false`      |
| `tsc-pretty.txt`  | `tsc --noEmit --pretty true`       |

**Provenance** [observed]: recorded on 2026-08-23 from the friction run 3 notes app
(`friction/run3/notesapp`, Expo SDK 57, TypeScript from `expo/tsconfig.base`), with two errors
introduced on purpose:

- `TS2322` at `src/app/notes.tsx(12,7)` — a function assignment whose diagnostic carries **two
  indented continuation lines**, which is what pins that a nested explanation is joined onto the
  message rather than dropped.
- `TS2339` at `src/app/notes.tsx(71,22)` — `Spacing.md` on a constant that has no `md`. This is the
  exact error the friction run found after every `@expo/agent-cli` gate had reported green: it is
  `undefined` at runtime, so the screen rendered with `padding: undefined` and no throw anywhere
  (F34).

`tsc-pretty.txt` keeps its ANSI escape codes, so that stripping them is asserted rather than
assumed. Both files end with the compiler's own summary line, which is not a diagnostic and must
not be read as one.
