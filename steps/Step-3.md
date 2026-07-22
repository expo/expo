# Step 3 — Spike + characterization tests

Branch: `@ubax/eng-transitions-support-in-expo-router`, at `97ff8f7143c` (`[step 2]` shadow
`useReducer` + deep-equal oracle). Scope source: PLAN.md **Step 3** + **risk 9** (which already
pre-decided most of the spike's open questions in round-3 review) + **D1–D5** (the mechanisms the
spike must validate before the Step-5 flip).

## ⚠️ Lead with this: what "spike" means here, and the one line that constrains the whole step

> **"No production code changes beyond the playground app."** — Step 3, final line.

Step 3 does **not** touch `src/` product code. Its deliverables are exactly three kinds of
artifact:

1. **A playground app** (`apps/router-e2e/__e2e__/transitions/app/`) with a lazy/suspending screen
   and a suspending loader — the simulator vehicle for every mid-flight behavior that risk 9
   classifies as **simulator-only** (pending-window duration, mid-flight pending values,
   native-urgent-flush interleavings, supersede).
2. **Jest characterization tests + fixtures** (`packages/expo-router/src/__tests__/`) that (a) pin
   *current* behavior (uSES still de-opts — a bare `router.push` to a suspending screen **flashes
   the fallback today**), and (b) deliver the reusable **controllable-suspending-promise fixture**
   and the **non-sync-import-mode escape hatch** that Step 5's red list needs. These are the
   jest-able set risk 9 enumerates; nothing here asserts a mid-flight pending value.
3. **This written spike document** — answers (d)–(i) below, each a decision the later steps cite.

The temptation to "start the flip early" (wrap a dispatch in `startTransition`, convert a read
site) is explicitly out of scope and would regress: Step 2 proved the reducer/queue entanglement,
and the flip is atomic in Step 5 for the reasons the plan gives. **If any spike finding
contradicts a plan decision (D1–D5, risk 1–10), stop and surface it to the lead — do not fold the
correction into product code here.**

## Risk-9 is already decided — Step 3 confirms, it does not re-open

PLAN risk 9 (round-3 verdict) settled the single biggest spike question **in the plan**, not at
Step 3: *"the concurrent-root branch is effectively dead"* — React 19 + RNTL 13.3 renders through
react-test-renderer's legacy root with **forced fake timers**, so a transition cannot yield
mid-render in that stack. Confirmed against the code:

- `renderRouter` forces `jest.useFakeTimers()` (`testing-library/index.tsx:77`) and
  `EXPO_ROUTER_IMPORT_MODE = 'sync'` (`:87`), and its `getPathname`/`getRouterState` helpers read
  **`store`** (`:101`, `:113`), which — per D1 — will *lead* during a pending transition once the
  flip lands. So those helpers assert the destination at dispatch, **not what is rendered**.

Therefore Step 3's exit criteria are narrow and pre-scoped:

- **Confirm** (with a runnable characterization test, not just prose) that this stack cannot
  observe a mid-flight pending window. The confirmation test is the artifact.
- **Deliver** the two jest fixtures the jest-able set needs (below), so Step 5 can write its red
  list against them up front.
- **Classify** every headline behavior as jest-able vs simulator-only, and write it down here so
  Step 5's red list is scoped correctly on day one.

**Jest-able (per risk 9):** final committed states; **fallback-absence across an awaited `act`**
(rendered-tree queries + controllable promises); `pendingActions` replay *final* states; the
same-tick `canGoBack` behavior change; the Step-2 shadow deep-equal.
**Simulator-only:** pending-window duration, mid-flight `isPending`/pending-id values,
native-urgent-flush interleavings, supersede-over-flush.

## The two jest fixtures (the concrete code deliverable in `src/`)

### Fixture 1 — controllable suspending promise (the primary suspending scenario, jest-able)

The lazy-bundle case cannot suspend under `renderRouter` (sync import mode skips `React.lazy` —
`useScreens.tsx:269`). But **every route screen is already wrapped in a `React.Suspense` boundary**
(`useScreens.tsx:396`, confirmed by review — the boundary is unconditional; import mode only
changes how `ScreenComponent` is built, not whether the boundary exists). So a route component that
calls React's `use(promise)` on a test-controlled promise suspends inside its own boundary
**regardless of import mode**. That is the escape hatch.

**Nearest existing precedent (review — reuse the shape, this is not net-new invention):**
`src/__tests__/SuspenseFallback.test.ios.tsx:15-21` already does exactly `const pending = new
Promise(() => {}); function SuspendingRoute() { const value = use(pending); … }` inside
`renderRouter` with `initialUrl` targeting the suspending route, and asserts with the
double-assertion shape (`queryByTestId('route-content')` is null **and** the fallback testID is
present). Two things the new fixture adds over it: (i) a **controllable** deferred (`resolve`/
`reject`), where that test uses a never-resolving promise; (ii) **navigation to** the suspending
screen at runtime (`router.push`) rather than starting there via `initialUrl`. The new shared
deferred helper lives in **`src/__tests__/`** (co-located with this sibling test — not
`src/testing-library/`, which is public-facing harness surface), closing the note's own
"where do helpers live" open question.

- A tiny helper mints `{ promise, resolve, reject }` (a deferred). A fixture screen calls
  `use(promise)` and renders a `testID` only after it resolves; its `SuspenseFallback` renders a
  distinct `testID`. A sibling **origin** screen (e.g. `index`) renders its own `testID` so the
  test can assert Goal 1 part (b) — the previous screen stays mounted (see fixture-gap fold-in
  below).
- The test drives resolution **across separate awaited `act` boundaries** — `render`, assert
  fallback/old-screen state, `await act(async () => resolve())`, assert final. This is the only
  shape risk 9 says is jest-assertable for suspension.

**HIGH (test review) — the awaited-act ceremony, now DEMONSTRATED (not assumed).** The recipe
was built and run. Findings, empirically established (`transitions-characterization.test.ios.tsx`):

- **The only order-independent jest-observable shapes are two:** (1) fallback-present + origin
  unmounted immediately after `act(() => router.push('/slow'))` to a still-pending screen;
  (2) destination content committed when the promise is **resolved inside the same act that
  commits the navigation** (`await act(async () => { router.push('/slow'); resolve(); })`) — no
  explicit timer flush needed for this shape.
- **The fallback → content *recovery* across act boundaries is NOT observable.** Resolving the
  promise in a *later* act than the one that committed the fallback does **not** surface the
  destination in isolation — every flush strategy was tried (fake-timer microtasks,
  `advanceTimersByTime`, `runAllTimersAsync`, and switching to real timers) and none recovers it.
  This is direct evidence for risk 9's "mid-flight is simulator-only" verdict, on top of the
  legacy-root/fake-timer argument.
- **A suspected cross-test leak was refuted (do not carry it forward as a hazard).** An early
  one-off observation suggested a later separate-act resolve *appearing* to recover a committed
  fallback when preceded by a test that left an unresolved suspense — hinting at module-global
  leakage (`storeRef`/`routingQueue` do persist across `renderRouter` calls). **Three independent
  controlled re-runs** (byte-identical scratch pairs, with/without the dangling test, with/without
  explicit `unmount()`) **could not reproduce it** — recovery never occurred in any configuration.
  Treat it as a **false observation**, not a real leak. The two committed tests are verified
  **order-independent** (run in both orders, repeatedly, no flakes); keeping suspending tests
  isolated (one suspending nav per file, no dangling unresolved promises) is cheap hygiene, not a
  fix for a proven bug.

**Consequences folded into the committed test + Step 5's red list:** (a) the committed
characterization asserts only the two order-independent shapes; the recovery finding is *recorded*,
not asserted (a mid-flight-recovery test must not be committed — it is unobservable in this stack);
(b) Step 5's red list asserts **final committed states** (shape 2), never a mid-flight recovery.

**Falsifiability (test review) — the characterization assertion must not be a tautology.** A test
that only asserts the fallback testID is present passes just as readily if the fixture is broken
(typo'd testID, route never mounts). Mirror the existing test's stronger shape:
`queryByTestId('route-content')` is **null** AND the fallback testID is **present** AND the origin
screen's testID (`index`) is **still mounted** — so the assertion can only pass for the claimed
reason.

**Correctness fold-in — state the baseline's cause correctly.** At Step 3 nothing wraps dispatch
in `startTransition` yet (that is Step 5). So a bare `router.push` to the suspending screen flashes
the fallback today because it is an **ordinary synchronous Suspense commit** — there is no
transition to de-opt *yet*. The Blocker-1 framing ("uSES de-opts the transition") describes why
the flip *needs* the read-site conversion in Step 5; it is **not** the cause of today's flash.
This characterization pins today's plain-synchronous behavior, and Step 5 inverts its polarity
(fallback-absence once the read sites are converted *and* the dispatch is transition-wrapped). Do
**not** write "uSES de-opts" as the Step-3 cause — it would mislead Step 5's red-list author.

### Fixture 2 — non-sync import-mode: DECIDED simulator-only (jest can't reach the lazy path cleanly)

**Decision (folded from all three reviews — was an open item, now settled): the lazy-bundle
`React.lazy` path is characterized in the SIMULATOR, not jest.** Jest characterizes the suspending
*semantics* via Fixture 1 (`use(promise)`, import-mode-independent); the specific thing lazy mode
adds — the `React.lazy` branch at `useScreens.tsx:269-285` — is a Metro/bundler-loading concern
best characterized where the real bundler exists (the playground app), which is the *more honest*
characterization anyway.

Why not force `'lazy'` in a jest test — **two independent, stacking blockers** (both verified):
1. `renderRouter` hard-sets `EXPO_ROUTER_IMPORT_MODE = 'sync'` **inside its own body at call
   time** (`index.tsx:87`), clobbering any value a test `beforeEach` set. So the hatch can't go
   through `renderRouter` at all.
2. Even bypassing `renderRouter` (render `<ExpoRoot>` directly with the env pre-set),
   `import-mode/index.ts` is `export default process.env.EXPO_ROUTER_IMPORT_MODE || 'sync'` — a
   **top-level expression evaluated once at module load**; `useScreens.tsx:11` imports that already
   resolved binding, not `process.env` live. `jest.config.js` sets `clearMocks: true` but **not**
   `resetModules`, so the binding is fixed to whatever the first `require` in the worker saw. The
   hatch would additionally need `jest.resetModules()` / `jest.isolateModules()` + a fresh
   `require` of `useScreens`+`import-mode`, on top of hand-rolling ~90 lines of `renderRouter`
   setup (mock context, fake timers, systemTime, result augmentation) — a bespoke render path
   whose parity with `renderRouter` would itself need verifying.

Rejecting option (1) is not a capability gap in the plan: risk 9 already classifies the
lazy-bundle case as the "primary suspending scenario ... cannot suspend in tests without new
fixtures" and Fixture 1 is that fixture for the *semantics*; the `React.lazy` code path itself is
recorded here as **simulator-only for now** (Step-9 manual verification in the playground app), and
Step 5's jest red list scopes to the `use(promise)` suspension shape, not the lazy path.
(A `renderRouter` `importMode` option would be a testing-library public-surface change — a
Step-5/testing-ergonomics call, not Step 3; do not add it here.)

## The playground app (`apps/router-e2e/__e2e__/transitions/`)

Follows the standard `__e2e__/<name>/app/` convention (selected via `E2E_ROUTER_SRC=transitions`).
Minimal route set, purpose-built for the Step-3(f)/(g) simulator validation and reused in Step 9:

- a root `_layout` (native stack) + an index with `Link`s and imperative buttons;
- **a lazy bundle-split screen** (async route) that suspends on first navigation;
- **a suspending-loader screen** (`useLoaderData` / `use(promise)` on a fetch that a button can
  delay) to exercise risk 2's starvation window;
- a nested navigator (tabs) + a modal, to exercise native-urgent interleaving (swipe-back, native
  tab press, hardware back) against a pending JS push — the (f) decision vehicle;
- a visible "pending" readout wired to `useTransition` at the call site (characterizes caller
  `isPending`; the router-owned pending hooks don't exist until Step 8, so the app uses a caller
  transition as the stand-in probe);
- an **async-transition** button (`startTransition(async () => { await …; router.push('/slow') })`)
  so a human can observe whether the caller's transition scope survives the `await` — the (e) lever;
- the controllable delay is **keyed** (`delayPromise('slow' | 'lazy' | 'loader')`) so two suspending
  screens can be pending at once (tab + modal both pushing slow) without one resolve settling the
  other. `/loader` is a plain `use(promise)` suspending-data read, **not** expo-router
  `useLoaderData` — that pipeline is server-only (needs `unstable_useServerDataLoaders` + a server
  export) which this playground doesn't run; the client `use(promise)` characterizes the same
  suspending-data timing (risk 2 starvation) without the RSC/SSR machinery.

No product `src/` code changes. The app is a fixture; it exercises the *current* (pre-flip)
behavior so the spike's simulator observations are honest characterizations of today, and it
becomes the Step-9 manual-verification vehicle after the flip.

**Near-miss existing apps — checked and deliberately not reused (arch review).** Two existing
`__e2e__` apps look adjacent but don't fit, and building fresh is the right call:
- `__e2e__/server-loader/` already uses `useLoaderData` + `Suspense`, but its loaders are
  **server-executed** (`unstable_useServerDataLoaders`) — they resolve through the RSC/SSR
  pipeline, not a client-side delay a button can hold open indefinitely, so it can't stage risk 2's
  starvation window, and it has no native-tabs/modal/nested combo for the D5 interleaving.
- `__e2e__/native-navigation/` already composes tabs + modals + stacks (structurally closest to the
  D5 interleaving need) but has **no** suspending/lazy screen, and is dense with unrelated
  toolbar/header fixtures the transitions work shouldn't couple to.
A purpose-built `transitions/` app keeps the fixture minimal and uncoupled.

## Written spike answers — (d) through (i)

These are the decisions the plan asks Step 3 to *write down*. Where the plan already decided
(risk 1/2/9, D5), Step 3 records the decision + the evidence; where it asked the spike to *decide*,
Step 3 states the decision and the test that pins it later.

**(d) isPending attribution.** Question: does a `React.startTransition` fired from a native
callback stack commit as a transition, and does the monotonic-id pending design (D3) track it
through interruption? Simulator-only to observe mid-flight (risk 9). Recorded finding + the
simulator repro in the playground app; the D3 monotonic-id design is the *mechanism* that makes
this observable-in-committed-state (jest can assert the final id accounting; the mid-flight
attribution is simulator).

**(e) async composition (Goal 2).** Does the caller's async transition scope survive `await` + the
router's own `startTransition`? PLAN Goal 2 flags this as unproven and "the spike proves or
disproves it." Step 3 records the finding from the playground app + a written verdict; if it does
**not** survive, Goal 2 is downgraded to sync-only and the async case becomes documented-unsupported
(surface to lead — this changes a headline promise).

**(f) native-event reconciliation → validate urgent-by-rule (D5) + decide supersede-over-flush.**
D5 is already decided (native stays urgent); Step 3 *validates* it on the simulator (swipe-back,
native tab press, hardware back against a pending JS push) and **decides supersede-over-flush**.
Per PLAN D1's round-3 correction, supersede is mechanically **reduce-to-no-op** (React cannot
dequeue a pending update; the superseded action re-reduces after the urgent one and the reducer
must recognize it as stale from committed state and return it unchanged, recording the abandoned
nav id — D3). Step 3's deliverable is the **staleness predicate** (what committed fact the urgent
action records that lets the re-reduced transition action judge itself stale), written down for
Step 5/7 to implement + test.

**(g) starvation/timeout policy (risk 2).** Freeze-off does not close the hole; a never-resolving
loader holds a transition open forever (`isPending` stuck, old screen stuck). PLAN calls this a
**launch blocker for the flip** if unresolved. Step 3 writes down the decided policy — one of:
transition timeout → bail to fallback; app-surfaced error; or documented "loaders must implement
their own timeout." The written decision is the deliverable; implementation (if any) is later.

**(h) useReducer mechanics (D1).** Four sub-answers, all written here, each pointing at where it's
pinned:
  - **Registry-at-reduce-time under interrupted/replayed transitions** — the reducer reads the
    registry when React runs it (render time); replay re-reduces the same action against a possibly
    *newer* registry (purity guarantees no corruption; the outcome can differ). Decide + record what
    we promise (usually strictly-better: fewer unhandled).
  - **React's eager reducer invocation at dispatch** — confirm the purity contract holds and the
    Step-2 shadow scaffolding does no double *product* work (the shadow's second reduction is a
    known, accepted test-only artifact — Step-2 A2). Record that eager+render double-invocation is
    why `pendingActions` append must be **idempotent, keyed by action identity** (D1).
  - **State-carried `pendingActions` replay under interrupted transitions** — **written decision
    only, not a runnable characterization** (review): the state-carried `pendingActions` mechanism
    does **not exist in the repo yet** — Step 2 deliberately kept the ref-based `pendingReplayRef`
    (Step-2 A3) precisely to avoid the double-invocation idempotency hazard, deferring the
    state-carried form to Step 5. So Step 3 records the *intended shape* (idempotent identity-keyed
    append + drop-after-one-retry surviving interruption) for Step 5 to build; there is nothing to
    characterize against today. The jest *final-state* replay pins remain against the current
    ref-based mechanism (unchanged, green).
  - **`RECONCILE_ROUTE_NAMES` completion-signal redesign (D1 item 4)** — confirm the redesign
    shape (urgent reconcile dispatch; ref advance in the same render that first observes the
    reconciled committed slice; invariant tolerance widened to "reconcile pending **or** committed
    but ref not yet advanced"). Step 5 implements; Step 3 records the validated shape.

**(i) written answers to risks 4–7 and 10.** Short recorded verdicts:
  - **risk 4 (interruption + mixed priority)** — the Step-7 matrix is the pin; Step 3 records the
    supersede-vs-flush decision from (f) that the matrix depends on.
  - **risk 5 (`NavigationIndependentTree`)** — state per-container `useReducer`; only app root
    installs globally; record the existing two-container test + the new
    independent-tree-non-interference assertion as the pins (Step 2 already carries the
    non-interference item).
  - **risk 6 (SSR/RSC)** — downgraded (uSES passes the same getter as client+server snapshot, so
    no mismatch detection is lost); real requirement is seed idempotency under streaming SSR.
    Record: verify `rsc/web` + static-rendering snapshots; no new mechanism. **No RSC
    (`__rsc_tests__`) characterization test is added in Step 3** — a `use(promise)` fixture that
    never resolves would hang an RSC/static snapshot render, and RSC suspense-timing is out of scope
    per this seed-idempotency framing; it is covered by the existing `rsc/web` + static-rendering
    suites, not duplicated here. (Stated explicitly so a future author following AGENTS.md's "add
    RSC tests for new components" convention doesn't mechanically add one.)
  - **risk 7 (telemetry/devtools removals)** — R1/R2 already removed on base; `onStateChange`
    becomes commit-timed at the flip; record that remaining devtools must tolerate the new timing
    (Step 6 decision).
  - **risk 10 (StrictMode)** — record the two invariants to pin in Step 7:
    `pendingActions` replay under StrictMode double-effects, and `getState`/`deepFreeze`
    idempotency under interrupted (speculative) transition renders ("no `getState()` consumer has
    side effects").

## Files

**New (playground app — fixture, not product):**
`apps/router-e2e/__e2e__/transitions/app/**` (routes + `_layout`), and whatever the app config
selection needs (env-driven `E2E_ROUTER_SRC=transitions`, no config edit required — the root is
already env-parameterized at `app.config.js:71`).

**New (jest fixtures + characterization tests — test-only, in `src/`):**
`packages/expo-router/src/__tests__/transitions-characterization.test.*.tsx` (the synchronous-
Suspense-commit baseline + the confirmation that this harness cannot observe a mid-flight window),
and a small shared **deferred/`use(promise)` fixture helper co-located in `src/__tests__/`**
(next to its nearest sibling `SuspenseFallback.test.ios.tsx` — **not** `src/testing-library/`,
which is public harness surface). Do **not** change `renderRouter`'s public shape.

**No `src/` product-code edits.** The import-mode escape hatch is **decided simulator-only**
(Fixture 2 section) — no `renderRouter` change, no bespoke `ExpoRoot` render path in jest.

## Red → green

Red-first still applies, but for a **characterization** step the "red" is a test that documents
*current* behavior and fails only if that behavior is not what we claim. A characterization "red"
passes on today's code by design — so it needs a **falsifiability** check (a double-assertion that
can only pass for the claimed reason), else it is a tautology (test review).

Two committed tests (the order-independent shapes established under Fixture 1's HIGH item):

- **Baseline — fallback replaces the origin while pending:** a `use(promise)` fixture destination
  (fallback attached at a nested `(slow)/_layout`, since a leaf route's own `SuspenseFallback` is
  ignored) + a sibling origin (`index`) screen; `act(() => router.push('/detail'))`; assert the
  **falsifiable set**: `queryByTestId('slow-content')` is **null**, the fallback testID is
  **present**, and — the pre-flip fact worth pinning — the origin `index` is **unmounted**
  (today the fallback *replaces* the whole stack). Step 5 inverts this: previous screen stays
  mounted, no fallback. The fallback shows today because it is a **plain synchronous Suspense
  commit** (nothing wraps dispatch in `startTransition` yet — that is Step 5); do **not** attribute
  it to "uSES de-opt" (correctness review). The deferred is left unresolved and this is the file's
  **last** test, so its dangling suspense cannot leak into another (see the leak finding).
- **Final-committed-state — resolved-in-nav-act:** `await act(async () => { router.push('/detail');
  resolve('done'); })`; assert content present, fallback absent. This is the "fallback-absence
  across an awaited act" shape Step 5's red list uses. Ordered **first** so it never runs after a
  dangling-suspense test.

The mid-flight-recovery / harness-limit finding is **recorded in the file header comment and this
note**, not asserted as an in-file test (it is order-dependent — committing it would be flaky).
- **Note for Step 5 (test review):** the "same-tick `canGoBack` change" and `pendingActions`-replay
  *final-state* pins that Step 5 inherits read through `store`/`router.canGoBack()` — imperative
  store-readers. Pre-flip (Step 3) store and render are synchronous so these are fine, but post-flip
  those readers **lag** the rendered tree (D1). Step 5 must express any "what's on screen" pin as a
  **rendered-tree query** (`getByTestId`, or a `Link`/button disabled state), not a direct
  `router.canGoBack()`/`getRouterState()` read, or the pin quietly stops meaning what it claims.
- Full suite stays green (`CI=1 pnpm test`); nothing in `src/` product code changed, so no existing
  test should move. `et check-packages expo-router` green before commit.

## Commit

`[step 3] <one line>` — no body, no Claude mention. Then push
`HEAD:@ubax/eng-transitions-support-in-expo-router`.

## PLAN.md corrections (only if the spike reveals one)

Step 3 is the point where the spike either **confirms** the round-3 pre-decisions (risk 9 harness
classification, D5 urgent-by-rule, risk 1/2 freeze+timeout) or **contradicts** one. If a finding
contradicts the plan (e.g. async composition (e) does not survive `await`, or supersede cannot be
made a pure staleness predicate), that is a plan correction on a *final* plan → **stop and surface
to the lead**, do not edit product code. Record confirmations inline in this note; land any PLAN.md
edit only for a genuine correction, mirroring the Step-1/Step-2 note style.
