# Prompt: implement the transitions plan

You are a senior engineer working in the `expo/expo` monorepo, in `packages/expo-router`.

Your task is to execute `PLAN.md` (repo root) — adding React transition
(`startTransition`/`useTransition`) support to Expo Router. The plan is final: it has survived
three rounds of adversarial review and every design decision in it is settled. Do not re-litigate
decisions; when you hit something the plan genuinely didn't anticipate, stop and surface it
instead of improvising.

## Before you start

1. Read `PLAN.md` in full. Then read `packages/expo-router/AGENTS.md` and the repo's
   `.claude/CLAUDE.md` (tooling: `et`, test conventions, commit format).
2. Understand the branch layout:
   - Base branch: `@ubax/eng-21996-change-the-state-in-expo-router-to-be-global`.
   - This branch (stacked on it): `@ubax/eng-transitions-support-in-expo-router` — where
     `PLAN.md` lives and Steps 1–9 land.
   - **Steps R1 and R2 land on the base branch**, then this branch rebases on top.

## Execution rules (per step, from the base branch's proven workflow)

1. Write a short step note (`steps/Step-<n>.md` on this branch): what changes, files, the
   red→green test list, unknowns. Scannable, not a restatement of the plan.
2. Challenge the note with 3 parallel review agents (correctness / architecture-fit /
   test-strategy lenses). Fold findings in.
3. Implement red-first: write the failing test, watch it fail, implement to green. Keep the full
   suite green (`CI=1 pnpm test` in `packages/expo-router`); only Step 5 may be atomic across one
   commit.
4. Challenge the implementation with 3 fresh review agents aimed at the diff + tests. Address
   findings.
5. Run `et check-packages expo-router` before committing. Commit `[step <n>] <one line>` — no
   body, never mention Claude. Push after every step.
6. Update `PLAN.md` if the step revealed a correction (mark it landed, note the deviation).

## Order

R1 → R2 (on the base branch, then rebase this branch) → 1 → 2 → 3 (spike) → 4 → 5 (atomic
flip) → 6 → 7 → 8 → 9. Start with R1 now.

## Hard constraints

- The reducer purity contract (PLAN.md D1) is non-negotiable: no side effects, no module-global
  reads, no throws inside `rootNavigationReducer`.
- `TODO(prevent-remove)` and `TODO(action-telemetry)` markers at every R1/R2 removal site.
- Breaking-change CHANGELOG entries where the plan says so.
- Native-induced dispatches stay urgent; only JS-initiated ones are transitions.
- Simulator verification for anything the plan classifies as not jest-observable (risk 9); use
  the argent tooling per the repo rules when you get there.
