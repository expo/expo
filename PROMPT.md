# Prompt: execute the first step of the transitions plan (R1)

You are a senior engineer working in the `expo/expo` monorepo, in `packages/expo-router`.

Execute **only Step R1** of `PLAN.md` (repo root) — the first step in its order. Do not start any
other step; when R1 is committed, pushed, and green, stop and report. Each later step gets its
own fresh prompt and context.

The plan is final (three adversarial review rounds; decisions settled). Do not re-litigate it;
if R1's spec genuinely doesn't survive contact with the code, stop and surface the mismatch
instead of improvising.

## Before you start

1. Read `PLAN.md` in full — especially D1 purity-contract item 1 and the Step R1 section.
2. Read `packages/expo-router/AGENTS.md` and the repo's `.claude/CLAUDE.md` (tooling: `et`,
   test conventions, commit format).
3. Branch layout: R1 lands **on the base branch**
   `@ubax/eng-21996-change-the-state-in-expo-router-to-be-global` — check it out for the
   implementation. (`PLAN.md` lives on the stacked branch
   `@ubax/eng-transitions-support-in-expo-router`; after R1 lands, rebasing the stacked branch is
   a later concern, not yours.)

## The task (from PLAN.md Step R1)

Remove prevent-remove fully: `shouldPreventRemove` in `dispatchRoot`, the `changedSlices`
production in `rootReducer` (sole consumer), the `beforeRemove` emission,
`usePreventRemove`/`usePreventRemoveContext`/`PreventRemoveProvider`, and the render-time
consumers (`preventNativeDismiss` + header-back-menu gating in native-stack, the
experimental-stack equivalent, web `ModalStack` `dismissible` gating). `TODO(prevent-remove)`
markers at every removal site. Delete the feature's tests; rework tests that depend on the
wrapper indirectly (`SuspenseFallback.test` filters a console-error spy by the
`PreventRemoveProvider` component name). Breaking-change CHANGELOG entry
(`expo-router/react-navigation` subpath exports; note the enumerated regressions from D1 item 1).

## Workflow (per the base branch's meta-plan)

1. Write a short step note `steps/Step-R1.md`: what changes, files, the red→green test list,
   unknowns. Scannable, not a restatement.
2. Challenge the note with 3 parallel review agents (correctness / architecture-fit /
   test-strategy). Fold findings in.
3. Implement red-first where a behavior changes; keep the full suite green
   (`CI=1 pnpm test` in `packages/expo-router`).
4. Challenge the implementation with 3 fresh review agents aimed at the diff + tests. Address
   findings.
5. Run `et check-packages expo-router`. Commit `[step r1] <one line>` — no body, never mention
   Claude. Push.
6. Update `PLAN.md` (on the stacked branch) only if R1 revealed a correction; otherwise leave it.

Stop after step 6 and report what landed, what deviated, and anything the next step should know.
