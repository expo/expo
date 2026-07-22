# Kickoff — transitions plan, remaining steps (one fresh Opus agent per step)

**Orchestration:** implement Steps **2 → 3 → 4 → 5 → 6 → 7 → 8 → 9** of `PLAN.md` in order. Spawn a
**fresh Opus agent for each step**; start the next step only after the current one is committed,
pushed, and green. Hand each agent the block below with `{N}` filled in.

---

You are a senior engineer in the `expo/expo` monorepo, in `packages/expo-router`, on branch
`@ubax/eng-transitions-support-in-expo-router` (on origin, already rebased on base R1/R2).

Implement **only Step {N}** of `PLAN.md`. Don't start any other step. The plan is final — don't
re-litigate it; **if Step {N}'s spec doesn't survive contact with the code, stop and surface the
mismatch instead of improvising.** When it's committed, pushed, and green, stop and report.

**Before you start**
1. Read `PLAN.md` in full — especially Step {N}, the design section(s) it implements (D1–D5), and the
   risks it names. (`git show @ubax/eng-transitions-support-in-expo-router:PLAN.md`, or read it in the
   worktree.) Read the prior committed step notes if present.
2. Read `packages/expo-router/AGENTS.md` and the repo `.claude/CLAUDE.md` (tooling: `et` or
   `node ./tools/bin/expotools.js`; test conventions; commit format; red/green rule).
3. Use your own session worktree; the branch may be checked out live elsewhere. `git fetch` first and
   work from the latest origin tip. Land on origin via `HEAD:@ubax/eng-transitions-support-in-expo-router`
   (`--force-with-lease`) if you rebased.

**Standing lessons (carry forward)**
- **Do NOT delete the routing queue before Step 5.** Its one-React-cycle deferral is load-bearing;
  Step 5 (the `useReducer` render-flip) absorbs the deletion + the pre-ready buffer. Step 2's
  eager-reduce render path is still synchronous, so it will **not** fix nested-navigator-during-mount
  navigation — that's expected and only clears at Step 5. (Repro pins: `__tests__/issues.test` "can
  navigate during first render of nested navigator"; `__tests__/tabs.test` "set params for dynamic
  route via href, nested stack".)
- Keep `CI=1 pnpm test` green at every step. For "what's on screen," assert the **rendered tree**
  (`getByTestId`), not the store (PLAN risk 9). Mid-flight transition assertions are simulator-only.
- Pick the model/effort per subagent by task; reserve Opus/high-effort for the hard reasoning.

**Workflow**
step note `steps/Step-{N}.md` → 3 fresh review agents (correctness / architecture-fit / test-strategy),
fold findings in → red-first TDD (write the failing test first, watch it fail for the right reason) →
3 fresh impl-review agents on the diff, fold in → monorepo sweep + `et check-packages expo-router` →
commit `[step {N}] <one line>` (no body, **no Claude mention**) + push → update `PLAN.md` only if
Step {N} revealed a correction.

Stop after; report what landed, what deviated, and what the next step should know.
