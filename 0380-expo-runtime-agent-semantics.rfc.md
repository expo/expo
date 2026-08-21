# LLP 0380: The Runtime-Owned Agent Semantics Layer Expo Should Build

**Type:** RFC
**Status:** Review
**Systems:** Cross-pollination (Expo/React Native), Acto/Agent API, Contract (verification model), Verification, Process
**Author:** Charlie Cheever / Claude (Fable 5)
**Date:** 2026-07-21
**Revised:** 2026-07-22 (rev 23 — round-22 review response; full history in the Revision History appendix)
**Related:** `llp/agent-feedback-system.rfc.md` (the original agent-inspector RFC — Acto's actual origin; runtime-owned from the start), LLP 0032 (direct agent transport/compound execution — an Acto refactor, not its origin), LLP 0321 (Acto agent subsystem v2 — the mature shape this distills; Workstream E's host/device provider seam is the *pattern* precedent for §3.1's semantics-provider extension — semantic-subtree providers themselves are new work), LLP 0374 (Acto after Partitime — the evidence-facet model §3.0 adopts), LLP 0320 (agent API competitive comparison — the outside-in tool analysis behind §2.2), LLP 0326 (Acto cross-tool benchmark — pinned-run economics evidence behind §3.2), LLP 0365 (agent-first guide — the capability-discovery lesson behind §3.5), LLP 0085 (contract blocks — the claims model §3.4 ports), LLP 0278 (contract verification depth — the claims-tier design; §3.4's baseline is stated against current code, which has since landed the live clause forms 0278 planned: `change` outcomes, expression-valued counts, guarded `when`, runtime action-writes), LLP 0136 (Exact vs React Native rendering — the Fabric/Fiber/host-registry architecture §3.1 must join), LLP 0376 (cross-domain lessons *into* Exact — this document is the outbound sibling)

> **Scope note:** this RFC proposes work in the **Expo/React Native** product,
> not in Exact. It lives in this corpus because the design is distilled from
> Exact's Acto subsystem and the author co-owns both contexts. Nothing here
> changes Exact behavior; Exact appears only as the reference implementation
> of the pattern. Precedent for outbound/comparative docs: LLP 0136, LLP 0339
> (both Research; this is the corpus's first proposal directed at another
> organization's product, and the disclaimers here carry that weight).
> Because acceptance criteria live in another organization, this document
> uses LLP 0001's status vocabulary, with `Review` as the closest
> available resting status for a document whose acceptance authority is
> external: it sits at `Draft` until its review loop completes, then
> rests at `Review` — the author's position carried into Expo planning; it moves to `Accepted` only if a **named Expo
> decision authority approves a precisely scoped program**, with that
> decision artifact linked here (the author alone never advances it);
> it can never become `Implemented` in LLP 0001's sense, since nothing
> here is implemented in this codebase; once an Expo-owned authority
> replaces it, it moves to `Superseded`, and on rejection with no
> replacement artifact, `Withdrawn`.
>
> **Decision requested:** the immediate ask is authorization to
> **prepare the M-1 brief** — the populated artifact with numeric
> staff-week and calendar ceilings (per-item and aggregate, with the
> apparatus itself a line item and apparatus spend explicitly excluded
> from any continuation argument), sampling frame, kill/continue
> thresholds, the named sponsor, custodian, and adjudicator, **and a
> mandatory corpus-governance plan** for the sensitive data M-1
> collects (ecological Expo Agent traces, field incidents): defaulting
> to synthetic/internal or expressly authorized traces, and specifying
> source authority, consent/eligibility basis, minimization,
> de-identification and secrets scanning, raw-data access and audit
> logging, retention/deletion, partner-export rules, and
> conflict/recusal handling — with a CEO sponsor, custody and
> adjudication are external or carry enforceable operational
> independence, not just a reporting-chain clause. **M-1 execution
> requires a second approval of that brief**, which also checks the
> M-1 short-form pitch for claim-strength fidelity against this
> document (no pitch statement stronger than its §3.7 provenance row); M0 requires M-1's result; M1–M4 are contingent layers, each
> requiring fresh approval per the §4 spike matrix. Nothing in this
> document's status ever implicitly endorses the full program.

## 1. Summary

The React Native ecosystem has converged, fast, on agent-driven app
development: Expo ships an MCP server (docs, EAS, stores, plus a thin local
automation tier), Software Mansion ships Argent (control/debug/profile a
running app over MCP), Callstack ships agent-device (CLI inspect–act–verify
with accessibility-tree snapshots, element refs, diffs, and assertions), and
Expo Agent — the end-to-end app-building product — consumes all of it.

These tools observe the app **from outside the renderer's contract**: the
accessibility tree, XCTest/ADB, and devtools protocols. Some do reach React
internals (component trees, profiler data) through devtools channels, but
none has a supported, versioned semantics contract from the renderer itself.
Exact's experience building Acto says the ceiling of the outside-in approach
is structural, not incremental — and it also says something the naive
version of this proposal misses: a runtime-owned tree has its *own*
signature failure mode (certifying interactions no real user could perform)
unless input-delivery evidence is modeled as a first-class, separately-owned
fact.

This RFC therefore proposes that Expo build the inside half as a
**provenance-bearing evidence protocol** (working name: **RASP — Runtime
Agent Semantics Protocol**; the acronym collides with mobile security's
Runtime Application Self-Protection, so choosing a real name — candidates:
"Runtime Semantics Protocol (RSP)," "Expo Semantics Layer" — is an M0 exit
requirement, not a someday):
runtime semantics, renderer layout, native reachability, OS-driver-delivered
input, causal attribution, and claim execution are distinct facts,
contributed by distinct authorities (the runtime, the renderer, the native
host, and external drivers), each carried in an evidence envelope that
declares what was witnessed, by whom, about which incarnation of the app,
and how it was joined to the action under verification. Expo MCP, Argent,
agent-device, and Expo Agent all consume it; external drivers also
*contribute* to it (input-delivery facts) through a correlation protocol.
Expo's edge here is not literal exclusivity — it is that Expo controls the Expo-managed distribution channel (Expo
Go, dev clients, SDK releases — not the RN renderer itself) and
already absorbs RN version churn for the ecosystem, which is exactly the
maintenance burden that keeps outside-in tools outside. And the bet is
layered, not all-or-nothing: the protocol has a named **minimum viable
core** — host semantics, identity, opaque-region reporting, layout and
native-reachability facts, attestation, conformance (§4) — worth building
even if the hard layers (Fiber provenance, causal attribution, claims,
release certification) resolve pessimistically.

## 2. Motivation

### 2.1 The landscape (as of 2026-07)

| Surface | Owner | What it does | Observation source |
| --- | --- | --- | --- |
| Expo MCP server | Expo | Docs/EAS/store tools + 5 local automation tools (tap, screenshot, find_view, logs, router sitemap); iOS sim on macOS only | Simulator tooling |
| Argent | Software Mansion | Control (gestures, text, deep links), debug (logs, view hierarchies, React component tree, network payloads), profile (React↔native correlation); platform scope uncertain at retrieval — the docs page said sims/emulators while LLP 0320's earlier source notes recorded Android physical-device support in its README; resolved by the pinned M-1 record | a11y tree + devtools protocols |
| agent-device | Callstack | inspect–act–verify loop: a11y snapshots with `@eN` refs, action diffs, assertions, wait-and-settle, evidence capture, `.ad` replay / Maestro export; iOS/tvOS/Android/web/desktop | a11y tree (XCTest/ADB) + RN component tree |
| Expo Agent | Expo | End-to-end "idea → shipped app" product | All of the above (author's understanding as of 2026-07; validated at M-1/M0 like the rest of this table) |

Source notes: rows retrieved 2026-07-21 from docs.expo.dev/mcp,
docs.expo.dev/agents/argent, github.com/software-mansion/argent,
github.com/callstack/agent-device, docs.expo.dev/agents, and
expo.dev/blog/expo-agent-beta; tool versions were not pinned at
retrieval and these positioning claims will age quickly — the sources
are pinned and archived with the M-1 pitch (not deferred to M-1
execution), and M0 re-validates the table with partners directly. The table is
load-bearing for *positioning* (§3.5, M0/M4) but not for the *ceiling
argument* (§2.2), which is architectural; modest differences in any row do
not change the proposal. The one external assertion the proposal genuinely
rests on is narrow — *no current tool exposes a supported, versioned
renderer semantics contract* — and its validation is scheduled once,
consistently: M-1 entrance diligence performs the archived-source check
and renderer-owner inventory, M0 revalidates with written partner
confirmation, and discovery of an existing contract — even partial —
automatically reframes the work as interoperability *before* any
thesis-specific build arm is approved.

The outside half of the loop is being built well, by Expo's two closest
partner consultancies. Duplicating it would be redundant. The inside
half — a supported semantics contract from the renderer — is unowned:
the React DevTools backend protocol is the closest existing thing, and
it fails the bar on every axis that matters here (version-skew history,
human-tooling orientation, no layout/reachability/receipt facts, no
compatibility promise).

### 2.2 Why outside-in has a ceiling

These lessons come from Acto's design record and from Exact's benchmarking
of accessibility-tree-based agent tools (LLP 0320's competitive comparison;
LLP 0326's pinned cross-tool runs). Acto was runtime-owned from its first
RFC (`llp/agent-feedback-system.rfc.md`), with accessibility as one
projection of the runtime tree among several — the comparison below is with
the outside-in tools Exact benchmarked against, not with an abandoned Acto
design.

1. **Lossiness.** Accessibility trees drop nodes with no a11y
   representation, and the platform paths for developer handles differ
   (iOS `accessibilityIdentifier` vs Android's view-tag/resource-id
   routes), so handle coverage is inconsistent across platforms. Agents
   cannot reason about what they cannot see, and — worse — cannot know what
   they aren't seeing.
2. **Snapshot refs need a cross-snapshot identity behind them.** An a11y
   snapshot ref describes what was visible at capture time. Acto's answer
   is two-tier: refs are deliberately snapshot-local, and a renderer-owned
   `viewId` provides identity *across* snapshots for scrolling and
   re-render. Virtualized/recycled cells remain an open identity problem
   even for Exact (LLP 0321 OQ10: a recycled id means "this slot," not
   "this item") — §3.1 and §6 treat identity as a design problem to solve,
   not a solved import.
3. **Causal observation needs runtime cooperation.** After an action, the
   agent wants to know what changed and why. Outside-in tools can diff
   successive snapshots; correlating changes to the action that caused them
   — and distinguishing them from ambient re-renders — requires the
   renderer's commit pipeline (§3.2 for what this does and does not
   promise).
4. **Layout diagnostics need the layout engine.** *Why is this clipped /
   zero-size / behind that view* is answered from renderer layout state
   for renderer-owned clipping, sizing, and stacking — with native-host
   evidence for higher windows and host chrome (see item 5 and §3.3). The switcher-clicks bug class from Exact is the canonical
   example: every click on a visible, enabled control silently swallowed
   by a native overlay above it (a topmost highlight view claimed the
   hit) while every semantic check passed. It was not
   authoritatively diagnosable from accessibility/semantic snapshots
   alone, was *undetectable* by the semantic-mode tooling in use at the
   time (the LLP 0326 benchmark ran other tasks; the incident itself
   was not a benchmarked run), and its symptom was visible to real
   input all along (see item 5).
   Note the converse in item 5: renderer-layout facts alone are not
   input-delivery truth.
5. **Runtime-owned trees have their own false-positive class.** Exact's
   most expensive recent Acto lesson (the LLP 0321 Partitime boundary; LLP
   0374 exists to systematize it): an action can dispatch successfully in
   the semantic tree while host chrome, a higher native window, a system
   alert, or the keyboard makes the target unreachable by real input. "A
   press that only passes in semantic mode is suspect"
   (docs/acto-guide.md). Acto's remedy — `nativeReachability` evidence on
   receipts, native-window hit testing, an escalation ladder toward
   realistic input — is a design input to §3.0/§3.2/§3.3, and it is also
   why partners stay essential: XCTest/ADB drivers are where
   OS-delivered-input truth lives.
6. **Claims need semantics.** A verification layer ("this button exists and
   dispatches this action") can only be checked against a tree with stable
   identity and event-binding information.

### 2.3 Why Expo, why now

- **Expo Agent's reliability ceiling plausibly sits at this gap** — but
  that is a hypothesis this proposal budgets to test, not a premise: M-1
  measures the current failure distribution before anything is built. An
  agent that builds apps end-to-end is only as trustworthy as its ability
  to verify its own work — including *not* being fooled by semantic-only
  success (§2.2 item 5).
- **Standardization window.** Three vendors are shipping overlapping
  observation layers. Publishing the runtime-side protocol first can establish an early
  coordination point (whether it becomes the schema others map to is a
  governance and adoption outcome, not an automatic consequence). Expo's advantage is distributional
  and economic, not exclusive: shipping inside the renderer requires
  absorbing RN version churn, which Expo already does at ecosystem scale.
- **Exact has run most of this experiment.** Acto is the existence proof
  for the snapshot economy, receipts, diagnostics, and the discovery
  surface — exercised daily by agents building real UI
  (author-reported operational experience; the repository proves the
  capabilities, not the usage frequency) — and Contract's
  claims machinery is further along than its early docs suggest (see the
  mechanism matrix in §3.4). It is *not* proof of everything here: the
  observation-economics results are mixed (§3.2), and the Fabric/Fiber
  joins and attribution under concurrent React are new work. §3.7 grades
  every proposed capability by its actual provenance.

## 3. Proposal

Build the following in the Expo runtime, exposed as one versioned logical
schema, delivered dev-mode-first.

### 3.0 Design stance: evidence, not omniscience

RASP is a **provenance-bearing evidence protocol**. Distinct facts come
from distinct authorities and are never conflated:

| Fact | Authority |
| --- | --- |
| Target identity & artifact attestation (project, artifact digest, runtime version, effective configuration, process epoch) | Dev server + host bootstrap (attestation protocol) |
| Semantic structure & dispatch | JS runtime / renderer bindings |
| Committed layout geometry, clipping, stacking | Fabric/Yoga (shadow-layout intent) |
| Mounted native geometry, native-driven scroll/animation | Native host view registry |
| Native reachability (would an input at this point land?) | Native host (window-level hit test) |
| Runtime-witnessed native ingress | Native host / runtime (in-process observation) |
| In-process realistic input delivery (responder-path, identity-minting) | Runtime/host tier (§3.2) |
| OS-driver-delivered input | External driver (XCTest/ADB — partner-owned), via correlation protocol |
| Causal attribution (this commit ← this action) | Renderer commit pipeline, where propagated |
| Router state & transitions | Expo Router (settled route, transition records) |
| Claim execution | Claims runner over the above |

**Verification is bound to an attested target, at a stated evidence
strength — and for Expo, the target is compositional.** An Expo app's
identity is not one digest: native build identity, embedded *and
activated* EAS Update identity with its JS hash, the asset graph,
effective config/plugin inputs, runtime compatibility, and the
development module/HMR epoch all change independently, so the attested
tuple is a **compositional manifest with per-component invalidation
rules** (an OTA activation or rollback invalidates exactly what it
changes), with activation, rollback, mixed-update, and asset-mismatch
fixtures alongside the ones below. And the trust boundary is stated,
not implied: `measured`/`signed` evidence detects **mismatch among
trusted participants** — it is not device-integrity or tamper
attestation, and claims never assert what only an independent attester
could prove. A correct receipt from the wrong project, a stale bundle, a
differently-configured build, or a surviving old process is still a false
pass — the expectation-binding lesson of LLP 0374 W1. Every claim and
receipt binds to the attested tuple (project, artifact digest, runtime
version, effective configuration, process epoch); verification that
requires target identity **fails closed** on mismatch or unknown. And the
binding itself is graded: each attested field carries an
**attestation-evidence class** — `self-declared` | `compared` |
`measured` | `signed` (0374 W1's ladder) — plus its authority, freshness,
and invalidation rule, because a process that *self-reports* the expected
digest satisfies the tuple syntactically without proving which bytes it
loaded. Certification profiles (§3.4) name the minimum class per field;
claims about loaded bytes and effective configuration require `measured`
or `signed`. Conformance fixtures: wrong-project, stale-bundle,
same-revision/different-config, mixed-HMR state, process restart,
dev-channel-vs-release-artifact, and **expected-manifest-self-reported
while running different bytes** — each must fail, not pass. The M3
tethered release-configuration verification artifact (§3.5) is this
same binding applied to the release-configuration sibling.

The **source-native facts and their join edges are the authoritative
record**; any convenient fused tree is a projection over that graph, never
a replacement for it — a projection must not erase which authority
supplied each field. Fields carrying on-screen content additionally carry
**content provenance**, adopting LLP 0271's **normative model in
full** (what Exact *ships* today is the taxonomy, the hostile-ordering
helper, and a hand-annotated tree slice — taint inference and per-span
provenance are explicitly deferred there, and several surfaces still
lack provenance; the model is the import, the coverage is new work): **separate source-authority
and authorship/intent axes**, the complete class vocabulary (`app` |
`system` | `user` | `other-user` | `third-party` | `external` |
`generated` | `data-unknown`), and an **effective class derived
conservatively** — when the axes disagree, the more hostile result
wins. Disclosure/redaction remains a further independent axis (per LLP 0374
W5).
Unclassified dynamic content defaults to `data-unknown` and is treated
as hostile (only statically-known literals may default to `app` —
incorrect provenance is worse than none); each stronger classification
names its authority; annotation/taint propagation, loss semantics, and
laundering fixtures — including the `user`/`third-party`/`external`
classes and conflicting-axes cases — must exist before provenance
informs any prompt-injection decision. And the 0271 invariant is
normative here too: **provenance is advisory; it can never authorize
effects or relax capability/consequence policy** — capability
confinement is the load-bearing layer, provenance the label on top.

**The evidence envelope.** Every fact carries, as separate axes:

- **domain outcome** — the producer's own verdict in its own vocabulary
  (dispatched / no-handler; reachable / blocked-by(x); delivered /
  rejected; committed / discarded). A witnessed negative ("the native hop
  was rejected") is evidence, not absence of evidence;
- **evidence availability** — `witnessed` | `degraded` | `absent`, with a
  separate **reason class** preserving why (`unavailable`, `unsupported`,
  `unobserved`, `evicted`, `timed-out`, `redacted`, `denied`, …). The two
  axes are deliberately not collapsed: an evicted expected fact is not a
  fact never produced, and redacted evidence can be present-but-degraded
  rather than absent. (This matches the crosswalk Exact actually ships —
  `packages/exact-devtools/src/agent/conditions/status-crosswalk.ts` —
  and LLP 0374's availability/reason separation.);
- **causal join method** — how this fact was tied to the action under
  discussion: `ingress-propagated` | `exact-key` | `armed-bracket` |
  `heuristic` | `none` (§3.2);
- **producer identity and native status** — which authority produced it and
  that producer's health;
- **producer incarnation and source revision** — which app run / root /
  commit revision the fact describes;
- **freshness and coordinate space** — capture time/skew, and the space
  any geometry is expressed in;
- **disclosure/retention** — whether the fact may be displayed,
  persisted, replayed, or exported to partners, composed
  most-restrictive-wins across wire projections, reports, replay,
  screenshots, and contributed evidence (a fact can be fully witnessed
  yet forbidden from display — `redacted`-as-availability-reason does
  not carry this).

Facts a verification *expects* but did not receive appear as explicit
obligations ("native reachability: obligation unmet"), never as silent
omissions. Heuristic joins never satisfy verification; they inform
exploration only. An **acceptance truth table** — which
(outcome, availability, reason, join) combinations may satisfy which
verification obligations — is part of the schema, with conformance
fixtures proving that degraded, evicted, timed-out, and redacted evidence
cannot accidentally satisfy a required check. The envelope, truth table,
and fixture manifests are published at M0 as a small normative protocol
appendix, separate from this document's strategic narrative.

**Snapshot coherence.** A "bundled snapshot" is a *bounded-skew cut*
across sources that tick independently — React commit, Fabric mount
transaction, native window state, screenshot capture — not an atomic
freeze. Each bundle declares the per-source revision/timestamp it captured,
and consumers classify the cut as `coherent` (revisions align), `skewed`
(bounded, declared skew), `contradictory` (sources disagree about the same
fact — a *useful result*, surfaced as such, not normalized away), or
`unavailable`. M0's fixtures must include mount lag, native-driven
transforms/scroll, higher windows, and screenshots racing commits.

The core projection is **host-semantic** (what exists, where, with what
handles and bindings); React component provenance (component names,
allowlisted props, fiber ancestry) is an optional extension, not a
requirement for one globally fused tree.

This stance is the direct import of LLP 0374's evidence-facet model, and it
is what prevents RASP from institutionalizing the false-positive class in
§2.2 item 5.

### 3.1 Semantics tree with a snapshot economy

A runtime-owned tree correlating three in-process representations — none
of which is exposed through a supported Expo join today: the Fabric
shadow tree (renderer identity and committed layout intent — mounted
native view identity is a *separate* fact, joined from the native view
registry through tags/families, not read off the shadow tree), the React
component tree (provenance extension), and declared handles (testID,
accessibility label/role). The joins are genuinely hard — composites map to
zero or many host nodes, portals cross roots, native-view flattening
changes topology, fibers are internal — which is why M0 is an architecture
spike (§4), not a schema freeze.

Surface (names indicative, mirroring Acto):

- `snapshot()` → `{ snapshotId, tree }` — one bounded-skew bundle (§3.0);
  **every node carries a renderer-owned semantic node id**; addressable
  nodes additionally carry a **snapshot-local ref**. Nodes expose type,
  testID, a11y label/role, layout rect (with coordinate space), visibility
  and clipping flags, and which events they handle.
- **Identity tiers**, kept distinct (the two-tier Acto lesson, §2.2 item 2):

  | Identity | Owner | Scope & lifecycle |
  | --- | --- | --- |
  | `ref` + `snapshotId` | protocol | snapshot-local handle for addressable nodes |
  | semantic node id | renderer | on every node; stable across commits within a root incarnation; survives re-render; the cross-snapshot correlation key; carried as `{semanticId, lastSeenFingerprint}` so virtualized-slot reuse and handler/trust changes fail closed even for callers that bypass snapshot refs; behavior under keyed remount/recycling defined by M0 conformance cases |
  | `testID` / a11y label | author | human-declared handles; scoping per §3.5 |
  | native view tag | platform | debugging/join key only — remounting, flattening, and recycling may change it; never an agent-facing identity |
  | component instance provenance | provenance extension | optional |

  M0 conformance cases must cover sibling reordering, keyed remounts,
  Suspense/transitions, portals, native-view flattening, and
  virtualized-cell recycling ("this slot" vs "this item" — the open problem
  Exact shares, §6).
- **Targeting ladder** (for live, in-session interaction), in order:
  `ref + snapshotId` → semantic node id → `testID` → a11y label →
  coordinates (last resort). Acto's *documented targeting preference* is
  `ref → testId → label → viewId → coordinates`; placing the
  renderer-owned id *above* author handles is a deliberate RASP
  adaptation, justified by the RN context: author-handle coverage is
  exactly what §3.5 is still trying to establish by convention, while the
  semantic id is machine-stable and universally present, so it should
  outrank handles that may be missing or duplicated. The ladder is
  strictly session-scoped: the semantic id does not survive an app
  restart or rebuild, so **cross-run artifacts — replay recordings,
  claims (§3.4), codegen — target author handles or claim-local handles,
  never semantic ids.**
- **Staleness semantics** (adapted from Acto's shipped design): a ref
  whose target has *changed* since its snapshot fails loudly and
  instructs a refresh; a ref whose target is *verifiably unchanged*
  resolves, with the resolution mode carried on the receipt. (In Exact,
  `clean` refs resolve silently and only `stale-verified` emits a
  resolution receipt — and the whole graded path is itself flag-gated
  behind the incremental-serialization default; RASP receipting `clean`
  as well is new behavior, chosen so verification consumers never have
  to infer why a ref resolved.) Never a silent rebind.
  **Target-equivalence is a normative fingerprint, not an event-kind
  check:** Exact's current stale comparison records the *set of event
  kinds*, never handler identity, so a handler swap that keeps an
  `onPress` binding can stale-verify there. RASP's fingerprint starts
  from Exact's shipped staleness fact list (element type/original tag —
  the field Exact calls "role" — testId, label, disabled/inert,
  interactable posture, event-kind signature: the auditable baseline) and must extend it to semantic/owner identity,
  action-token/binding identity, trust/consequence posture, and
  native-reachability class — with handler-swap, token-swap, remount,
  trust-change, reachability-change, and coordinate-path fixtures. Until
  a deployment produces those fingerprint facts, stale refs **reject**
  rather than auto-resolve. Subtree-precise staleness (an ambient
  commit elsewhere must not orphan refs on an unrelated subtree) is the
  design goal; in Exact it is implemented but flag-gated behind the
  incremental-serialization default (LLP 0321 C1/B1), so RASP should treat
  it as a design requirement with partial precedent, not daily-proven.
- `screenshot(annotate: true)` — refs overlaid on the image, with the
  bundle's coherence classification attached (a screenshot racing a commit
  is `skewed`, and says so).
- Non-Fabric regions (interop views, native screens, WebViews, brownfield)
  are flagged per-region as `opaque` with bounds — the lossiness criterion
  (§2.2 item 1) applied to RASP itself: agents must know what they aren't
  seeing. A **semantics-provider extension** (the LLP 0321 Workstream E
  provider-seam pattern) lets custom native components, brownfield
  regions, and WebViews contribute bounded semantic/layout/reachability
  facts under declared producer identities and evidence ceilings;
  `opaque` remains the safe default for anything without a provider.

### 3.2 Action receipts

Every runtime-mediated action returns a **receipt** composed of separable
facts, each carried in the §3.0 envelope (domain outcome + availability +
join method + producer + incarnation + freshness):

- input delivery — for runtime-synthesized input, the runtime's own
  dispatch; for OS-driver-delivered input, the driver's witnessed delivery
  fact joined via the correlation protocol below;
- semantic dispatch — which handler fired, by opaque action token (§3.4);
- native reachability at the target point, captured immediately before
  dispatch against the pre-action state (§3.3) — the
  fact that distinguishes "dispatched in JS" from "an input delivered at
  this point would have reached the target." `unavailable` means
  *unknown*, never *reachable*;
- correlated commits and the resulting tree diff, where the renderer can
  propagate an action identity through its commit pipeline; ambient
  commits (animations, timers, polling — pervasive in RN) are the reason
  heuristic temporal correlation never satisfies verification;
- UI quiescence (bounded settle), reported separately from any data/domain
  convergence, which RASP does not claim to observe.

**Correlation grades.** A causal join is `ingress-propagated` only when
the action identity is bound at input ingress and carried through the
pipeline; `exact-key` means the fact was joined on a unique platform/driver
event key both sides witnessed. **Only these two grades are
verification-grade — with no exceptions.** A prepare/arm protocol — an
expiring, single-use nonce that brackets one driver-delivered input —
yields `armed-bracket`, which never satisfies verification: bracketing
establishes at most uniqueness among *observed* ingress, not the identity
of the sole observed event. (The counterexample that kills lease-hardening:
the driver's event is dropped or diverted while exactly one ambient,
human, or delayed event arrives inside the bracket — an "uncontested"
lease then joins the wrong event to the nonce. Exact's own exclusive
gesture lease only supersedes other agent sessions on a root; it cannot
exclude human or OS ingress, and no app-side mechanism can.) An
**exclusive-input lease** remains useful as a *diagnostic* hardening —
observed competing ingress still forces `unresolvable`, and geometry/
timing consistency between the driver's delivery fact and the observed
ingress is reported — but it upgrades nothing. Deterministic conformance
cases must include "intended event dropped + sole ambient substitute" and
"delayed prior event is sole ingress," both yielding `unresolvable`.
Temporal inference is `heuristic`. (A quantified-error-bound tier —
bracketing with measured ambient-event rates — was considered and
rejected as a verification grade: the sole-event-substitution
counterexample is about *identity*, not frequency, and no measured rate
distinguishes the wrong sole event from the right one.) Whether XCTest/ADB paths can carry
true ingress identity or a shared exact event key is an open question
(§6); the protocol is honest at whichever grade a platform achieves, and
claim kinds (§3.4) say which grades they accept. Receipts also preserve
input-fidelity detail (requested mode, actual mode, serving authority —
the LLP 0306 / evidence-adapter vocabulary; these concepts ship in Exact
but are not one uniform tap-result shape today): semantic vs
OS-delivered is too coarse for diagnosis.

**The in-process realistic tier.** RASP includes a runtime/host-owned
**in-process responder-path delivery tier**: input synthesized inside the
app process at the platform event boundary, exercising real responder
routing and gesture arbitration without OS-level injection or device
automation. The shipped precedent is Apple-only — Acto's LLP 0306 P1
tier, `UIWindow.sendEvent` on iOS and `NSWindow.sendEvent` on macOS; an
Android `MotionEvent` dispatch analog is *proposed RN-specific work*, not
precedent. Two honesty rules govern this tier:

- **Minting is not propagation.** The in-process synthesizer can mint an
  identity for the event it intends to deliver; that identifies the
  *intended* input, not the one that arrived at the handler.
  Verification-grade (`ingress-propagated`) status requires *proving*, per
  platform, that the same identity is bound to the concrete native event
  and observed at the intended action token after native dispatch,
  gesture arbitration, responder routing, and RN event conversion —
  with ambient, concurrent, dropped, diverted, and delayed-input
  conformance cases. (Acto does not fully supply this either: ingress-identity minting
  has landed on its *semantic* dispatch path only (the event-trace
  operation mints it; an ordinary semantic tap does not), while the realistic
  path still correlates via trace baselining — and what LLP 0374
  explicitly flags as new owner work is causal `commitId` minting; the
  end-to-end realistic-event binding is simply not built anywhere.)
  Until a platform carries that proof, its in-process joins grade
  `heuristic` or `unresolvable`, and **the non-driver `responderOperable`
  path is disabled on that platform.**
- **Known gaps are declared, per tier.** In LLP 0306's table form:

  | Mode | What it proves | Known gap |
  | --- | --- | --- |
  | Semantic dispatch | Handler wiring | Everything physical |
  | In-process responder delivery | Responder routing, gesture arbitration, handler observation inside the app | OS event taps, Accessibility/TCC, cross-process window ordering — anything outside the app's own windows |
  | OS-driver delivery | Device-level input reaches the app | Correlation grade (§ above); driver cannot see in-app handler outcome without the runtime join |

This does not touch §3.6's partner boundary: OS-level and device-level
input synthesis (hardware events, system surfaces, other apps) remains
partner-owned; the in-process tier can only reach the app's own windows,
and that limit is exactly its declared gap.

**Contributed-evidence trust model.** External drivers are contributors,
not oracles: contributor principals are authenticated; facts are bound to
an app/device/run channel; nonces are single-use and expiring; receipts are
replay-protected; and each contributor has an **evidence ceiling** — a
driver cannot upgrade its own facts to a grade the runtime did not
witness. Adversarial conformance cases (concurrent input, forged and
duplicated receipts, delayed delivery, wrong-target, driver crash, ambient
input) must exist before M3 consumes contributed evidence.

**Economics honesty:** receipts are proposed here for *reliability* — an
agent that reads "dispatched, but reachability obligation unmet" does not
ship a broken flow. Exact's evidence on the *token economics* of
diff-first observation is mixed: diff-first remains opt-in in Acto because
paired model runs used more total and uncached input in the diff-first arm
(LLP 0326; LLP 0321 F2), and completion rate — not token count — is the
metric that matters. M2 reports observation-economics numbers but does not
gate on them (§4). What concurrent React does to "the commits this action
caused" (transitions, deferred updates) is open (§6); receipts ship with
the correlation grades above precisely so the answer can be honest
per-fact. If attribution degrades to `heuristic` on most real apps, the
layer remains differentiated on coverage-explicit structure, native reachability,
and diagnostics alone — none of §2.2 items 1, 4, or 5 depends on
attribution.

### 3.3 Layout and interaction diagnostics

Structured queries answered from the renderer and the native host, each
answer labeled with its authority and envelope (§3.0):

- `why_invisible(ref)` — clipped by which ancestor, zero-size from which
  constraint, opacity/display, off-viewport (committed-layout authority;
  mounted-native geometry consulted where native-driven animation/scroll
  can diverge from committed intent).
- `hit_test(x, y)` / `why_not_hittable(ref)` — the layout-tree hit path
  *and* a native-host probe over the window/surface classes the app
  process can see (native authority; the Partitime lesson). **Every
  reachability fact declares its per-platform enumeration scope** —
  which window and surface classes the probe could observe (own windows
  and keyboard visibility are platform-contingent M0-produced scope
  facts, not cross-platform guarantees; cross-process system surfaces
  such as permission dialogs: not enumerable on iOS) — and occlusion classes *outside* that
  scope are reported as an explicit unverifiable residual on the verdict,
  never silently absorbed into `reachable`. (Exact's shipped probe is
  likewise bounded — in-process and therefore same-app by construction,
  with the iOS bridge enumerating only strictly *higher* window levels
  in the current scene — and its tap receipts report reachability facts
  rather than this full machine-readable enumeration residual, which is
  new RASP behavior; same-level *other-window* and cross-process occlusion are residuals
  there too (same-window hierarchy is inspected; the iOS bridge
  enumerates only other windows at strictly higher levels), and the iOS realistic-input precedent is
  DEBUG-only via private UIKit hooks, so distribution legality is its
  own residual. The scope declaration is what keeps such limits
  honest.) Where the probe
  is unavailable, the answer is `unavailable` — unknown, never presented
  as reachable.
- `resolve_target(ref)` — recommended interaction point and which
  stacking/scroll ancestor is responsible for the current occlusion state;
  in Acto these were the highest-leverage diagnostic outputs in
  practice (author-reported operational experience).
- `stacking(ref)`, `safe_area()`, layout-constraint dumps for a subtree.
- Verdict diagnostics are generated from the proof graph as
  **minimal-cut explanations**: the smallest missing or contradictory
  evidence set preventing a claim from passing — the evidence algebra
  doing double duty as the agent's repair hint. The same graph drives a
  **proof-directed acquisition planner**: request the cheapest
  authoritative facts first, escalating to native probes or external
  drivers only when the unresolved minimal cut requires them — bounding
  observer effect and driver cost by construction. Authoritative fact
  *production* stays in renderer/runtime code; graph fusion, ledgers,
  report generation, and claims planning live in dev-server tooling
  unless runtime ownership is required, limiting renderer-version
  coupling.

### 3.4 Declared claims (v2 of the layer; v1 of the syntax is deliberately small)

Port the contract-block *verification* model (LLP 0085) without the
Contract notation and without overpromising. v1 claims are limited to what
the evidence layer can actually check:

```ts
// v1 primary form: route-scoped — no React component identity involved
routeClaims('/profile', [
  has('button', { testID: 'save' }),
  press('save').dispatches(token('save-profile')), // token() = claim
  //   matcher; action() = the authoring wrapper that declares the token
  press('save').nativePointReachable(),
]);

// (string arguments resolve as claim-local handles — testID within the
// claim's scope; selector forms like has('button', {...}) are sugar)
// second-phase form: component-registered (mechanism below)
claims(ProfileScreen, [
  has('button', { testID: 'save' }), // claim-local: resolves within this
  press('save').nativePointReachable(),     // instance's subtree, not root scope
]);
```

- **Claim kinds declare minimum evidence facets over a proof graph, not
  a ladder.** Interaction evidence facets — `semantic-wired`,
  `native-hit-reachable`, `responder-delivered`,
  `expected-handler-observed`, `resulting-commit-attributed` — form a
  directed graph in which `semantic-wired` and `native-hit-reachable`
  are *independent* nodes (either can hold without the other). Each claim
  kind names the graph nodes, edges, and join grades it requires; any
  ordered "tier" label derived from the graph is a display aid with no
  authority (the LLP 0374 W3 rule, which Exact's causal-trace code
  restates). No overloaded "operability" boolean can overstate weaker
  evidence:
  - `has` / `missing` / `count` / `state` (enabled / disabled /
    checked / unchecked — live in Exact today; presence itself is expressed there
    via `has`/`missing` — though Phase A's implementation performs geometry-visible selection
    for *all* selectors (every emitted selector carries
    `visible: true`), while the `interactable: true` expectation comes
    only from the `visible` state-clause lowering, so only the runtime monitor approximates raw committed-tree
    presence, and the pair is worse than incoherent for `hidden`:
    runtime `state ... hidden` is currently *unsatisfiable* (zero
    matches fail before state evaluation; any match reports `hidden`
    violated) while Phase A lowers `hidden` to absence from the
    visible-filtered projection — a fourth Exact defect this analysis
    surfaced — and **`present` is RASP's term**, motivated by
    Exact's conflicting `visible` implementations below) —
    semantic-structure facts, each carrying a **semantic-scope coverage
    facet** (`complete` | `partial` | `opaque` | `unavailable`) for the
    scope it queried, because a partial tree cannot prove absence: a
    positive `has` witness may pass under any coverage, but `missing`
    passes only under `complete` coverage (no-match under incomplete
    coverage ⇒ `unresolvable`), and exact `count` requires `complete`
    coverage — otherwise it reports only a lower bound. (Exact's Phase A
    is the unsafe precedent here: zero observed matches passes `missing`
    with no completeness fact — a node hidden in an opaque provider
    subtree would false-pass. Fixtures: opaque-provider, failed-provider,
    stale-coverage, contradictory-coverage, and the opaque-duplicate
    case — a visible match plus an unseen duplicate in an opaque region
    makes `state`/`press`/`change` targeting ambiguous, so those claims
    require complete scope or independently sealed target uniqueness.) `present` (one term, no alias; `has(selector)` is its authored
    syntax — `present` names the *predicate* a `has` witness proves) is
    deliberately the strongest semantic-only visibility-adjacent claim: **`visible` is *not* a
    semantic fact.** A clipped, off-viewport, transparent, or occluded
    node is semantically present while imperceptible (Exact's own
    precedent is incoherent here — its Phase A lowers `visible` to
    `interactable` while its runtime witness treats committed-tree
    presence as visible — which is the cautionary tale, not the
    import). In RASP, `visible` is a proof-graph claim over committed
    layout, viewport/clipping, mounted-native geometry,
    opacity/transform, and the declared occlusion scope, with residuals
    where system surfaces cannot be enumerated — and negative fixtures
    for offscreen, clipped, transparent, native-transformed,
    same-app-occluded, and system-occluded content;
  - `press(x).dispatches(a)` — `semantic-wired`: the handler bound to
    token `a` ran when semantically invoked; proves nothing about
    reachability or real input routing;
  - `press(x).nativePointReachable()` — `native-hit-reachable`: a witnessed
    counterfactual native hit test at the target's interaction point
    (the literal names `nativePointReachable`/`responderOperable` are
    adopted here outright, per the naming-tracks-proof-strength rule —
    the earlier `userReachable`/`userOperable` names sounded stronger
    than what they prove and made overclaiming easier),
    **evaluated at the scenario step that exercises the claim** (a
    target requiring scroll-into-view or modal state is only meaningfully
    probed in that state); `absent` availability (for any reason) ⇒
    verdict `unresolvable`, never `passed`. This is *not* proof the real
    responder path works — gesture arbitration, presenter guards, or
    native handler bindings can still be broken (the semantic-mode gaps
    Exact's input-fidelity authority reserves realistic input for). v1
    scope: point interactions (`press`/`tap`) only — drag/pan/swipe need
    trajectory reachability, which is not designed here;
  - `press(x).responderOperable(token('save-profile'))` — the expected
    token is named *in the claim syntax* (or bound normatively to one
    unambiguous sibling `dispatches(token(...))` claim); inferring it
    from the live binding is circular — a wrong handler would become
    its own expectation — and a missing, changed, or ambiguous token
    identity yields `unresolvable`. `expected-handler-observed` via real
    input: one input from the in-process realistic tier (§3.2, where its
    propagation proof exists) or an OS driver, causally joined at
    `ingress-propagated` or `exact-key` grade through native ingress and
    the responder path to the expected action token. This certifies
    "operable through the app's responder path, **modulo occlusion
    classes outside the reachability probe's declared scope**" (§3.3) —
    **input plumbing, not product correctness**: a correct token can run
    a no-op or wrong implementation and still pass;
  - `press(x).causes(assertion)` — the v1 **causal postcondition**
    claim: requires the expected action token, a same-action
    `resulting-commit-attributed` join, and the assertion evaluated
    against that attributed state — a pre-existing or
    unrelated-concurrent-commit truth must not pass. Provider/domain
    outcomes (the mutation actually landed) require authoritative
    mutation receipts (the LLP 0278 rule) or return `unresolvable` —
    UI-state postconditions are what v1 can certify. Fixtures:
    expected-handler/no-change, wrong change, pre-existing
    postcondition, unrelated concurrent commit, an ambient update
    satisfying the assertion in the *same coalesced commit* as the
    target action (fail closed when per-change provenance cannot
    distinguish the causes), backend failure, optimistic rollback;
  - `press(x).navigatesTo(route)` — a route-outcome claim with the same
    causal contract every claim kind carries: it requires the expected
    action-token observation causally joined, at a named verification
    grade, to an Expo Router transition and settled-route fact (§3.0
    router row) on the same attested run. Ambient or merely
    contemporaneous navigation (redirects, timers) must not pass; absent
    causal evidence ⇒ `unresolvable`. Navigation is Expo's most
    differentiated runtime surface, and the Exact precedent here has
    three distinct levels: *static navigation-declaration checking
    ships* (dead links, params, redirects, alternates, exits —
    `packages/exact-devtools/src/navigation-contracts.ts`); *live
    settled-route receipts against declared edges ship* and attach to
    affordance-driven interactions — carrying the *matched declared
    edge's* metadata, not an observed interaction-provenance join
    (`packages/exact-router/src/navigation-receipts.ts`); what does
    *not* exist anywhere is the propagated action-token→transition
    causal join — Phase A does not consume its emitted action identity —
    so that join, and only that join, is new work;
  - `press(x).osDelivered()` — the delivery leg alone (driver input fact
    at verification grade); insufficient for operability unless it joins
    to the same handler observation as `responderOperable` requires. Bare
    `armed-bracket` and `heuristic` never satisfy it.
- **Two claim scopes, sequenced to decouple identity risk.** Claims
  attach at two scopes: **route/root-scoped** claims and
  **component-registered** claims (the `claims(Component, ...)` form).
  Route scoping avoids React *component* identity, but it still needs
  **route-instance identity**: a pathname names the claim *declaration*,
  while evaluation and ledger entries bind to the mounted instance —
  app/root incarnation, router entry key, mounted-route incarnation, and
  params/location identity — because retained stack entries, two entries
  with the same path and different params, and the same route in
  multiple roots/windows are all distinct surfaces. Conformance cases
  cover exactly those three, plus Expo Router layout routes and groups
  (a route rendered inside nested layouts/shared segments is a fourth
  identity wrinkle: instance keying must state whether it sits below or
  above the layout-route boundary). Route-scoped claims ship *first*: they
  let the evidence protocol and verifier earn reliability before taking
  on React registration semantics, and for Expo Agent's generated apps —
  where routes are the unit of generation — they cover most of the
  value. Component registration follows with the mechanism below, and
  route-scoped claims remain first-class permanently — they are the
  natural unit for generated apps, not a compatibility tier awaiting
  removal.
- **Registration vs attribution identity.** Registering claims against a
  component (`claims(ProfileScreen, ...)`) is a *mount-time* association —
  a different use of identity than cross-render dispatch attribution. v1
  supports exactly one mechanism: an explicit registration handle wrapped
  at export (or applied as a hook), which fails loudly on HMR remount and
  rejects anonymous `memo`/HOC-wrapped usage rather than silently
  re-associating. Mechanism sketch: the handle carries a module-scope
  token minted at registration; a mount whose component identity does not
  carry the token (HOC wrapping) is rejected, and a remount presenting a
  new token under an existing registration name fails registration until
  explicitly re-registered. Richer registration behavior is the v2 design
  (§6).
- **Per-instance scope, claim-local handles.** Claims register against a
  mounted instance and check within its subtree; multiple instances check
  independently. Handles inside a claim resolve claim-locally
  (`{claimInstanceId, localTestID}`), so reusable library components can
  ship claims without colliding with root-scoped app handles (§3.5).
  Exact precedent here is *partial*, in two ways: its Phase A selector
  runner searches the supplied root rather than an instance subtree; and
  while its monitor evaluates witnesses per mounted instance internally,
  the public agent join queries by component *name* and attaches all
  same-name witness results to each handle — instance identity is lost at
  exactly the boundary RASP cares about. Fully instance-scoped
  verification is therefore a RASP requirement, not a proven import, and
  "two same-name sibling instances with divergent state" is a required
  conformance case.
- **Action tokens, not function identity:** `action('save-profile')` is an
  opaque stable token attached at the event binding and carried on
  dispatch receipts. Authoring side, the v1 sketch is a wrapper —
  `onPress={action('save-profile', handleSave)}` — with a hook variant for
  dynamic handlers, and Expo Agent's codegen emits tokens by default.
  React function identity across re-renders and wrappers is unsuitable
  and is not used. Where no token is declared, `press(...)` claims weaken
  explicitly to "dispatched something" — and the *weakening rate* is a
  tracked metric: at M1 as a static proxy (share of interactive nodes
  with declared tokens), and as the true tokenless-claim rate once
  claims run at M3; it measures whether the authoring surface is
  actually adopted — and M0's frozen metric set either includes a
  token-coverage floor for the M3 gate or states explicitly that v1
  token coverage is an Expo Agent codegen property with brownfield
  adoption a non-goal, so the metric has a decision attached, not just
  a dashboard.
  (Exact provides partial precedent here: Acto tap receipts can carry
  action/owner provenance — an optional field populated from eligible
  Contract dispatches under the dev-mode interaction context, not from
  arbitrary interactions — though its Phase A verifier does not yet
  consume it. Token *registration* for arbitrary React is the new part.)
- **No state guards in v1.** `when(s => ...)` requires a defined fact
  projection from component state, per-instance evaluation scope, and a
  redaction story; state-guarded claims are a v2 design item (§6).
- **Verdict vocabulary:** every claim evaluation returns exactly one of
  `passed` | `failed` | `unvisited` | `unsupported` | `unresolvable` |
  `timed-out`, plus the evidence facets it consumed. Verdicts are
  themselves attestation-bound artifacts (§3.0): each names the attested
  tuple it was evaluated against. An **observation ledger** records which
  required claims were exercised by which scenario, and a run renders to
  a human-auditable, diff-stable **evidence report** — a verification
  manifest on two axes, proof strength × obligation coverage
  (route instance × action token × consequence class × required outcome
  × strongest profile), so the *negative space* a bare profile name
  hides is visible — the artifact Expo Agent
  attaches to a PR or build, the honesty machinery made visible to end
  users, not only to gates. The normative schema and wire corpus are
  named independently of the interim "RASP" working name, so the M0
  rename cannot perturb conformance work.
- **Certification profiles, and "done" gating without a weak-gate
  escape.** Three named profiles expand mechanically to required graph
  nodes, join grades, and **declared occlusion residuals**, so marketing,
  agents, and CI cannot blur tiers. Profiles and milestone exits are
  **per platform** — a profile certified on iOS says nothing about
  Android:
  - `semantic-development` — required claims `passed` with
    ledger-verified exercise, plus `nativePointReachable` by default for every
    user-gesture claim (exceptions: explicitly declared per claim,
    audited, and never able to satisfy an operability assertion).
    Residual: everything past semantic wiring + probe-scoped
    reachability;
  - `responder-operability` — `semantic-development` plus `responderOperable`
    for user-gesture claims. Residual: occlusion classes outside the
    probe's declared enumeration scope (e.g., cross-process system
    surfaces on iOS) — a system-overlay conformance fixture must show
    this profile does **not** report green under a system surface it
    cannot see; it reports the declared residual. Wherever such a
    residual exists, this profile's result is **always visibly
    qualified** ("responder path verified; system occlusion unverified")
    and can never be rendered or exported — by Expo Agent, CI, or any
    durable artifact — as an unqualified pass;
  - `release-configuration-attested` — `responder-operability` on an
    attested **instrumented release-configuration sibling**: a build
    from the same source revision and effective configuration as the
    release candidate, in release configuration, differing *only* by the
    verification channel — with the shared and differing inputs
    themselves attested at `measured`/`signed` class (§3.0). The
    artifact model is chosen deliberately and its limit stated in the
    profile's own name: because production builds strip the channel
    (§3.5), the exact distributed bytes carry no verifier, so v1 makes
    **no claims about shipped store bytes, period** — this profile
    certifies the release *configuration*, and its language must say so.
    (Exact-byte attestation — a dormant authenticated channel in the
    shipped binary, or two-artifact attestation of shared payload
    sections plus wrapper — is a distinct threat/size/privacy design
    deferred to §6; if ever built, a successor profile can claim bytes.)
    A differential run between instrumented and uninstrumented siblings
    cannot prove byte equivalence, but it bounds the verification
    channel's behavioral and performance perturbation, and is part of
    this profile's evidence.
    The profile's driver leg **requires verification grade**
    (`ingress-propagated` or `exact-key`, per §3.2); if OQ4 resolves
    pessimistically on a platform, this profile is *unattainable there*
    and release-grade claims remain unavailable — recorded as such,
    never quietly weakened. This is the strongest profile, per platform,
    after an end-to-end run — and even it never authorizes
    "shipped-app-verified" language, only
    "release-configuration-verified."

  **The consequence classifier is named, and its default fails safe.**
  Consequence class is a provenance-bearing descriptor on the action
  token (declared in code, emitted by Expo Agent codegen, lint-checked);
  task-critical navigation obligations ride the same descriptor on
  `navigatesTo` claims. **Unclassified exercised interactive gestures
  default to consequence-bearing** — the obligation applies unless an
  explicit, audited downgrade exists, so a generator that forgets to
  label a destructive action gets *more* obligation, not a silent
  fallback to `semantic-development`. Classification coverage is a
  tracked, gated metric, with a mutation fixture: an unlabeled
  destructive action must still acquire the `responderOperable` obligation or
  fail the completion decision loudly. The escape valve gets teeth too:
  **downgrade share is tracked with an M0-set ceiling**, and a downgrade
  audit means a named approver and a recorded artifact — otherwise the
  rational response to expensive obligations is mass downgrades and the
  fail-safe default is theater. (Gestures inside third-party library
  components the author cannot token-annotate will be a common
  obligation source; library claims — §6 — and claim-local handles are
  the intended answer, and the downgrade ledger will show whether they
  suffice.) The profile↔mechanism contract is a normative table, not
  prose:

  | Profile | Input mechanism | Same-action join required | If unavailable |
  | --- | --- | --- | --- |
  | `semantic-development` | semantic invocation + native point-reachability probe for gesture claims | n/a (probe is counterfactual) | probe `absent` ⇒ gesture claims `unresolvable` |
  | `responder-operability` | in-process tier **or** OS driver — either | `ingress-propagated`/`exact-key` to the action token | unattainable on that platform; recorded (§3.2 disable rules) |
  | `release-configuration-attested` | `responder-operability` **plus `osDelivered`** (OS driver required) | verification grade, joined to the same handler observation | unattainable; recorded, never weakened |

  Profiles expand to declarative proof obligations and are
  property-tested: generated counterexamples for monotonicity,
  cross-action substitution, missing evidence, and attempts to compose
  two individually insufficient facts into a stronger verdict. Expo
  Agent's generalized product "done" is gated twice. First, on a
  **closed obligation universe with a sound closure authority** — and
  the honesty here is that arbitrary React Native has none: Exact's own
  navigation analysis records that React edges cannot be statically
  closed, and LLP 0085's `exits only` is an *authored* exhaustive
  declaration, not inferred completeness. So generalized "done" is
  scoped to the one place closure is real: **Expo Agent–generated Expo
  Router apps under a build-sealed obligation manifest** —
  proof-carrying generation output (Metro/Router/codegen emits the
  manifest of routes, event bindings, action tokens, consequence
  classes, and required outcomes; native and provider semantics
  contribute bounded submanifests; runtime registration reconciles
  against it; the attested artifact binds its content-addressed digest;
  dynamic escape hatches disqualify). Closure feasibility is an M0
  experiment and an M3 entry gate. Brownfield and hand-authored apps
  keep the honest weaker result permanently. And one limit is stated,
  not papered over: **the generated manifest closes implementation, not
  intent** — the generation authority cannot emit an obligation for a
  feature absent from its own inputs, so a "delete account" that
  vanished from both code and manifest is invisible to it. The verdict
  tiers accordingly: the manifest-scoped result is
  **"build-sealed implementation obligations verified on
  ⟨platform/profile⟩"** — unqualified "done"/"product complete" is
  prohibited at every tier — and the stronger
  **"sealed specification satisfied"** exists only where an
  *independently authored, frozen pre-build acceptance manifest* is
  attested alongside the artifact-derived one and the two reconcile
  bidirectionally (Expo Agent must never silently rewrite the standard
  its own output is judged by). The omission mutation is stated
  satisfiably: an *implemented* destructive action omitted from the
  obligation manifest must block; an intent-level omission is caught
  only at the specification tier. Within manifest scope, every
  obligation is exercised-and-passed or explicitly waived under audited
  policy — and waivers cannot become the escape hatch the downgrade
  ceiling already closes elsewhere: **a waived consequential obligation
  blocks sealed/generalized verdicts or schema-forces
  `qualified`/"declared scenarios verified" with a visible residual**,
  waiver share is tracked with an M0-set ceiling, each waiver records
  approver/rationale/artifact, and a mass-waiver conformance mutation
  must fail; unknown, opaque, or unvisited *consequential* items block
  the verdict, so an implemented-but-forgotten destructive button or
  never-visited route cannot sit outside the ledger. And sealing closes
  *declarations*, not the behavioral space they quantify over: the same
  token behaves differently for `/item/1` vs `/item/2`, authenticated vs
  not, permission branches, feature flags, or the hundredth list row —
  exercising a declaration once verifies one point, not the domain. So
  each obligation carries a **domain model** in the coverage-algebra
  sense (declaration identity x route-parameter/data partitions x
  precondition/state fingerprints x instance quantifiers x scenario
  inputs — coverpoints with finite partitions, cross-coverage, waived
  bins, unreachable bins, and residuals): the sealed verdict is
  available only over *sealed, finite, covered partitions* (or an
  accepted equivalence argument across an unenumerated dimension), and
  any unbounded, opaque, or uncovered dimension restricts the result to
  "declared scenarios verified" with an explicit residual. Mutations:
  the same token passing for one parameter/item/state while failing for
  another must not produce a sealed pass; a consequential affordance
  created after ledger capture must block.
  Mutations: an *implemented* destructive action omitted from the
  obligation manifest, a newly added unvisited route, an untokenized
  third-party gesture, and an action added after ledger capture — each
  must block. Absent the closed
  universe, the result is named **"declared scenarios verified"** and
  generalized product-completion language is prohibited. Second, on
  proof strength: **`responder-operability` for consequence-bearing
  gestures** on each platform it claims — and for those same gestures a
  `causes(...)` postcondition, since operability without outcome is
  plumbing;
  `semantic-development` may gate only explicitly-labeled development
  checkpoints and is always reported under that name — never as
  generalized "done." The profile-level result type is itself closed and includes
  **`qualified`** — "passed with declared residual, never renderable as
  green" is a normative representation, not just a presentation rule.
  Profile names, residual qualifications, and
  prohibited completion phrases are **schema-generated and linted** in
  every consuming surface (Expo Agent UI copy, CI dashboards, evidence
  reports): prose policy alone will not stop a dashboard from
  abbreviating a qualified result to "passed." A flow whose presses passed only as `dispatches`
  satisfies no profile. This is the §5 promise — "verification never
  accepts semantic-only success" — made normative, without letting
  `nativePointReachable` quietly play the operability role either.

**Exact precedent, stated against current code (2026-07-21), not early
docs** *(corpus-internal calibration detail — like the Revision History
appendix, this paragraph — and every Exact-defect parenthetical in the
claim-kind bullets above — is dropped from externally shared
renderings)*: Contract's machinery today spans four mechanisms — compile-time
checking (exact-set verification of `writes`/`derive` declarations over
analyzable IR, stated precisely: the action-header `writes` list is
*optional* — an action with no header compiles without write diagnostics;
when a header is present, it is set-compared, with under-declaration an
error and over-declaration a warning ("exact-set enforced" belongs to
the authored contract-block clauses below, which error both ways); the
contract-*block* clause forms (`action … writes`, `derive … depends`) are
likewise optional and exact-set checked as errors when authored; and
opaque import boundaries degrade to warnings in action/task contexts
while strict project mode errors on them in pure/resource/query
contexts — and an action with *neither* a header write declaration
*nor* an authored contract-block write clause has **no** static or
monitor write-set obligation at all: the runtime monitor checks only
authored contract-block clauses, and an unvisited undeclared action
produces no observed write-set evidence. One caveat cuts the other way:
Exact's dev-time dataflow inspector collapses an absent header to an
empty declared set and exact-compares it against observed writes,
folding the disagreement into the agent-facing verdict (the raw
`writeContractOk` exists for dev-registered Contract instances
generally, while the verdict gate becomes contract-block-scoped through
the verify-claims operation, which skips components without contract
blocks) — a de facto observational gate that appears accidental; RASP
obligations affect verdicts only when *authored*, by rule), runtime
monitoring (`action-writes` checking on invocations — per-invocation
`actualWrites ⊆ declaredWrites` against authored clauses, versus the
static clause check's exact-set equality; explicitly the
defense-in-depth layer for escapes the static picture misses — plus
passive invariants, auto-watched for root-mounted components today),
read-only witnessing (instance-scoped internally;
see the public-join caveat above), and Phase A live verification —
read-only assertions (`has`/`missing`/`state`, expression-valued counts)
plus effectful interactions (`press`/`change` with outcome assertions),
with guarded `when` live over a whitelisted subset of live
assertion/interaction clauses (guards around excluded forms do not
emit) —
with `derive … depends` static-only, and the interaction evidence
split at *three* distinct levels — direct semantic `press` witnesses
that *some* press-family handler ran (not its identity, not
reachability — the underlying tap receipt may carry optional Contract
action/owner provenance, but Phase A does not consume it); direct
`change` witnesses **value injection/commit only** unless separately joined to handler evidence (Exact's type
operation commits the batch and forcibly reports `dispatched: true`
even when the dispatcher found no Change binding — a third Exact
defect this analysis surfaced); and the DOM fallback witnesses browser
event *injection* only — no handler observation. RASP inherits none of this
overloading: receipts carry distinct `valueCommitted`,
`handlerObserved`, and `nativeIngressObserved` fields, never one
`dispatched` boolean; the react-native-web arm (§4 M-1) must expose
which level it witnessed and can never promote an injection-only path
to `semantic-wired`; and a no-Change-handler fixture proves the
distinction
(`packages/exact-contract/src/compiler/analyze.ts`,
`packages/exact-contract/src/runtime/contract-monitor.ts`,
`packages/exact-contract/src/runtime/dataflow-inspector.ts`,
`packages/exact-devtools/src/agent/contracts.ts`,
`packages/exact-devtools/src/agent/contract-inspection.ts`,
`packages/exact-devtools/src/agent/input.ts`,
`packages/exact-router/src/navigation-receipts.ts`). The action-token and
minimum-evidence-facet designs above are RASP's additions, not ports.

The compile-time checking Contract gets from its closed world —
exact-set *error* enforcement for authored contract-block
write/dependency clauses, asymmetric diagnostics for optional
action-header write declarations, and syntax/name/purity validation of
guarded clauses — is out of scope for arbitrary React and stays an
Exact-side differentiator. (Not because "JSX is not statically analyzable" — lint
rules, schema checks, and literal-handle validation are all possible and
worth shipping — but because sound whole-component effect and dependency
inference is not available for arbitrary JS.)

### 3.5 Delivery and positioning

- **Logical schema first; transports are projections.** RASP is a
  versioned schema with a **renderer-neutral evidence core** and
  separately versioned Expo Router / EAS / Expo Agent extensions (a
  single Expo-shaped schema would raise adoption costs for exactly the
  consumers the standardization thesis needs) — a schema (tree, identity tiers, evidence envelope, receipts,
  diagnostics, claims verdicts); HTTP/WebSocket on the dev server and MCP
  are projections of it. (Acto precedent, stated accurately: its
  operations ship over HTTP/MCP today — the lesson exported here is
  schema/authority discipline, not a wire format.)
- **Discoverable by construction (the LLP 0365 lesson, mechanically):**
  the capability manifest — supported operations, evidence facets, and
  degradation states — is *generated from the same operation/evidence
  registries the implementation runs on* and validated against the
  conformance corpus, so the manifest cannot drift from the registries —
  though behavioral drift beyond what the conformance corpus covers
  remains possible, which is why the corpus grows with the schema;
  clients negotiate rather than hard-code an assumed level. RASP also ships a first-party agent
  skill/onboarding surface (the analog of Acto's onboarding op and the
  generated `exact-inspect` skill) — with LLP 0365's *actual* design,
  not a generated approximation of it: an **authored intent/capability
  and GAP authority** (aliases, owner, expiry, remedy, runnable
  examples), joined *bidirectionally* to the generated
  operation/evidence registries with implementation witnesses where
  shipped — because an implementation-generated index cannot name a
  capability that does not exist, and GAP honesty is the point. Clients negotiate
  against the schema version too: a consumer pinned to schema vN meeting
  a vN+1 runtime gets a declared compatibility answer, not undefined
  behavior. Capability that exists but agents
  can't find is capability that doesn't exist.
- **Partners as co-designers and contributors.** SwM and Callstack review
  at M0 (review is sought and scheduled, but Expo-controlled engineering
  exits never depend on it — §4); the driver-correlation protocol (§3.2)
  gives them a role no adapter can replace; a published conformance suite
  plus a recorded wire corpus (including degraded and adversarial cases)
  makes "consumes RASP" a test result rather than a bilateral claim —
  and the suite includes a **result-presentation case**: a qualified
  `responder-operability` pass rendered unqualified fails conformance,
  because Expo's own linting cannot bind partner surfaces.
- **Development security is in scope from the start.** Not just a bearer
  token on mutations: RASP reads expose structure, geometry, labels,
  screenshots, and (via the provenance extension) component identity —
  sensitive on their own. Pre-M1 threat model covering: target
  registration and principals (including the Expo Go case, where one
  long-lived host app loads many projects and target identity ≠ app
  identity); loopback-by-default with explicit opt-in for LAN/tunnel/CI
  transports — every non-loopback hop requires authenticated encryption
  (or an explicitly trusted encrypted tunnel) with channel binding and
  replay protection, since credentials, screenshots, and contributed
  evidence traverse it, and destructive-effect confirmations are
  host-owned and bound to the exact operation, target, principal, and
  consequence descriptor; Host/origin validation and anti-DNS-rebinding;
  token scope and rotation; token-gated sensitive reads, not only mutations; redaction
  defaults covering visible text, input values, screenshots, claim
  scenarios, and retained receipt history — not only props (no arbitrary
  prop or function serialization, allowlists only); contributor
  authentication and evidence ceilings (§3.2); audit receipts; and
  guaranteed build-stripping/default-off in production builds. The
  genuinely borrowed controls are Exact's converged posture — loopback
  defaults, target registration, Host/origin validation, and
  authenticated effects and selected sensitive host reads (ENG-23118;
  posture documented in docs/agent-api.md and the original
  agent-feedback-system RFC). Token-gating *ordinary* structure/screenshot
  reads goes beyond what Exact ships today (its loopback reads are
  open); RASP deliberately strengthens that posture rather than
  inheriting it.
- **Handle discipline as convention, specified:** app-level `testID`s are
  unique per screen/root and lint-enforced; list items use stable per-item
  handles (not index-derived); reusable components use claim-local handles
  (§3.4) rather than competing for root-scoped names; production stripping
  policy is explicit; docs, lint rule, and Expo Agent's codegen treat
  handles on significant nodes as required. The handle quality determines
  everything above it — and handle *scoping* determines whether identity
  survives the public API: Exact's own witness join loses instance
  identity precisely because its public query key is a component name,
  even though internal evaluation is instance-scoped (§3.4). Name-keyed
  public APIs are how instance identity dies; that is the argument for
  claim-local handles.
- **Dev-mode first, dev clients first.** Ships in dev clients, off in
  production builds by default. **Scope: New Architecture only** — the
  fact table is built on Fabric; old-architecture apps are out of scope,
  full stop. Expo Go delivery comes only after a dedicated
  compatibility/isolation gate (§4 M-Go): Go's one-host-many-projects
  model makes target identity ≠ app identity, and shipping the layer in
  Go charges binary-size/startup cost to every Go user regardless of
  agent use, so Go inclusion carries its own payload budget and
  cross-project isolation conformance tests. A production tier (opt-in,
  authenticated, redacted) is deliberately deferred (§6); a *tethered
  release-configuration verification artifact* (the instrumented
  release-configuration sibling of §3.4 + its dev-only verification
  channel, pre-submission) is defined at M3 so "works in the dev
  client" is never silently promoted to release-grade language — and
  release-grade language itself stays scoped to the release
  configuration, never distributed store bytes (§3.4).

### 3.6 Explicit non-goals

- **Not a driver/automation CLI.** Device orchestration, OS-level and
  device-level input synthesis, video capture, CI replay belong to
  agent-device, Argent, and Maestro. (The in-process responder-path tier
  of §3.2 is runtime-authority and in scope — it synthesizes events only
  inside the app's own process and windows, which no external driver can
  do with minted ingress identity.)
  RASP defines how their input-delivery facts join the evidence model
  (§3.2); it does not replace them — OS-delivered input is a fact the
  runtime cannot produce, only consume (§3.0's fact/authority table; the
  false-positive consequence of forgetting this is §2.2 item 5).
- **Not Contract-for-Expo.** Porting Exact's authoring notation is a
  separate, larger bet (an incubator experiment at most, timed after
  Contract's notation freeze); this RFC takes only the verification model,
  which carries no notation risk.
- **Not a devtools UI.** React DevTools remains the human surface; RASP is
  the machine surface. They may share plumbing.

### 3.7 Capability provenance matrix

What this proposal actually rests on, per capability:

| Capability | Provenance |
| --- | --- |
| Snapshot economy, snapshot-local refs, loud staleness on changed targets, annotated screenshots | **Shipped Acto precedent** (daily agent use — author-reported); receipted `clean` resolution and the semantic-id ladder placement are **deliberate RASP adaptations** (§3.1) |
| Receipted `stale-verified` + graded staleness, subtree precision | **Adaptation** — implemented in Exact but flag-gated (LLP 0321 C1 riding default-off B1), with an event-kind-only equivalence check; RASP's target-equivalence fingerprint (§3.1) is **new design** |
| Target/artifact attestation binding | **Adaptation of LLP 0374 W1** (expectation-binding sessions); the RN/Expo attestation protocol is **new design** |
| In-process realistic input tier | **Adaptation** — Acto's shipped LLP 0306 P1 tier (windowSendEvent / touch-sequence); the RN responder-path implementation with minted ingress identity is **new work**, feasibility spiked at M0 |
| Cross-snapshot identity tiers | **Adaptation** — Acto's two-tier model; recycling/virtualization open in both contexts |
| Receipts with evidence envelope | **Adaptation** — Acto `observeAfter` + `nativeReachability` + LLP 0374's facet model; the normative envelope and commit-causal attribution are **new design** with 0374's propagated-id requirement |
| Diff-first observation economics | **Open evidence** — Exact's own results mixed (LLP 0326); report-only here, never a gate |
| Native-reachability facts, escalation ladder | **Shipped Acto precedent** (shipped before and validated by the Partitime boundary) |
| `resolve_target`, `stacking`, diagnostics doctrine | **Shipped Acto precedent**; a named `why_invisible` with causal constraint provenance, and all Fabric/Yoga/native-host implementations, are **new RN work** |
| Claims tier | **Adaptation** — LLP 0085's model with substantial live machinery in current Exact code (§3.4 matrix); action tokens, minimum evidence facets, verdict vocabulary, ledger, claim-local handles are **new design** |
| Driver correlation + contributed-evidence trust model | **New design** (LLP 0374's evidence classes as input) |
| Fabric/Fiber/native joins, snapshot coherence, concurrent-React attribution | **New RN-specific design** (M0/M1 spike territory) |
| Landscape table, partner posture, Expo Agent internals | **External assumption** — sourced §2.1, validated at M-1/M0 |

## 4. Milestones

Two bounding disciplines govern the whole plan. **Every M-1 item and M0
spike is a bounded experiment**: each carries a staff-week and calendar
ceiling (numbers assigned in the M-1 funding brief, structure fixed
here), spikes are ordered by information value, each has a preregistered
stop/narrow/pivot outcome, and M0 is a set of independently gated
experiments, not one cumulative exit — the M0 brief tables each spike
(ceiling, dependency, stop/narrow/pivot result, which milestone it
unlocks, and whether failure removes an optional layer or blocks the
minimum core). And the protocol has a named
**minimum viable core** — host semantics, identity tiers, opaque-region
reporting, layout + native-reachability facts, attestation, and
conformance — with Fiber provenance, claims, content-provenance
tainting, and release certification as separately fundable layers; the
MVP core is what still justifies M1 if the provenance or attribution
spikes resolve pessimistically. After M0, the work splits into
separately governed specifications (core schema/conformance;
renderer/native joins; input identity and driver integration; claims
and scenario execution; release attestation) — this RFC remains the
strategic map, never the single implementation contract.

The thesis split is closed over the whole decision contract by a
normative **thesis-by-milestone matrix** (maintained as a
content-addressed decision ledger — changes require a new approved
version, not prose drift):

| Gate / deliverable | Reliability thesis | Standardization thesis |
| --- | --- | --- |
| M-1A ecological prevalence gate | **required** (funds build arms) | inapplicable |
| react-native-web prototype | required *within* the funded reliability build arms (conditional on M-1A) | inapplicable |
| Schema/ledger + partner-appetite arm | optional | **required** (own demand signal) |
| M0 core spikes (host-semantic join, identity/coherence/attestation, reachability) | **required** | **required** (protocol integrity is universal) |
| Cheap-arm superiority + held-out false-pass improvement | **required** (economic gates) | inapplicable — replaced by **executable partner consumption, gated pre-M1**: at least one non-Expo design partner runs the schema/ledger and conformance corpus over its own recorded facts (via a provided recorded-fact adapter) and names an integration owner and timeline or ships a minimal adapter; absent that, any native M1/M2 spend under this thesis is explicitly labeled Expo-funded option value, never evidence-backed standardization |
| M2 shadow calibration + adjudication | **required** | **required** |
| M3 claims product + agent-in-the-loop gate | **required** | inapplicable |
| M4 external adoption evidence | optional upside | **required** |

A failed reliability gate kills only the reliability branch — it never
blocks a standardization program that has its own demand signal — and
vice versa. Universal protocol-integrity requirements (zero-false-pass
negatives, envelope conformance, fail-closed attestation, the
result-presentation rule) bind both branches; cheap-arm superiority and
false-pass improvement are reliability-only economics. And where the
M0 vertical slice meets an unavailable optional layer (commit
attribution), the slice **passes by representing the absence
faithfully** — an explicitly absent/heuristic edge whose dependent
claim verdict is `unresolvable` — rather than blocking the core.

Metric definitions and thresholds are frozen at M0 and versioned with the
fixture corpus; deterministic negative fixtures permit **zero false
passes**; every fixture carries an **expected-fact manifest** (node
recall, event descriptors, geometry, identity/staleness transitions,
opaque regions, evidence availability) so positive semantic completeness
is tested, not assumed — a tree that omits bindings or nodes cannot pass
by succeeding at a task. Observation-economics numbers (screenshot count,
tokens) are **report-only throughout** — reliability metrics gate,
economics inform.

- **M-1 — exploratory baseline (labeled as such).** A short-form pitch
  (problem, evidence, the M-1 ask with its ceilings, kill criteria —
  and the non-negotiable minimum on its first page, so no trimmed
  variant is ever presented without it)
  precedes the funding ask — the M0 decision brief has a smaller M-1
  sibling, names actual people/teams for the three independence roles
  M-1 depends on — sponsor/DRI, held-out corpus custodian, non-author
  incident adjudicator; the custodian and adjudicator sit **outside the
  sponsor's reporting chain and independent of every evaluated tool
  vendor** (an external reviewer preferred; a partner engineer only for arms in
  which their own tool is not scored), because with a CEO sponsor
  "non-author" alone does not buy independence (permanent ownership is an M0 exit) — and the M0
  decision brief presents the trimmed-to-the-non-negotiable-minimum
  variant as a first-class costed option, not a fallback footnote. Preregister the
  incident taxonomy, sampling policy, and tool/version pins, then run
  current Expo Agent and current outside-in tooling against the shared
  positive/negative fixture corpus (a11y-hidden nodes, duplicate labels,
  stale snapshots, virtualized lists, portals/modals, native overlays,
  non-Fabric regions, ambient noise), and catalog real false-success
  incidents from the field — and, separately from the adversarial
  corpus, a **blinded, stratified, denominator-bearing ecological
  sample** of ordinary Expo Agent generation/repair tasks, reporting
  failure-family *prevalence* (base rates, not just detector
  capability), abstentions, the independently adjudicated
  RASP-addressable share, and cheap-arm recovery. M-1 is split
  accordingly, with **thesis-specific gates preregistered in the
  brief** so neither thesis can suppress or revive the other post hoc:
  **M-1A** (the ecological baseline + cheap-arm comparison) runs first;
  the *reliability-thesis* build arms (the react-native-web prototype)
  are funded only if M-1A clears a preregistered
  addressable-prevalence threshold — "measure before building,"
  literally — while the *standardization-thesis* arm (the schema/ledger
  experiment and partner-appetite test) proceeds on its own separate
  demand signal: the entrance-diligence confirmation that no supported
  renderer contract exists, concrete partner integration interest, and
  an acceptable compatibility-cost ceiling. Low Expo Agent failure
  prevalence kills the reliability build arms without silencing the
  standardization evidence, and vice versa. Include **cheaper-alternative arms** on the
  same corpus: (a) stricter handle discipline + best-current outside-in
  tooling, and (b) a devtools-only JS instrumentation variant — RASP must
  beat the best cheap arm, not just the status quo. Also stand up a
  **schema validator/ledger over existing outside-in facts** — a low-cost
  test of the evidence vocabulary, the contribution model, and partner
  standardization appetite before any Fabric work. Each field incident
  is packaged as a privacy-preserving **fact-gap card** (minimized
  replay, ground truth, decisive missing fact, current-tool ceiling,
  proposed producer with a feasibility field — supported hook /
  plausible upstream hook / maintained patch / unknown — so
  "addressable" is never mistaken for "economically feasible" before M0
  prices the seam, disclosure policy, raw-data custody) so partners
  and adjudicators can judge incidents without routinely receiving full
  source traces. A named deliverable of the reliability build arms (conditional on the
  M-1A gate), with its own exit, is the **react-native-web arm**: deploy the envelope and claims runner on
  DOM joins — "easy" is a timeboxed feasibility hypothesis, not a
  budget assumption (LLP 0136 did not pin react-native-web internals) —
  with identical Expo Router state, earning authoring
  feedback on the claims vocabulary and profiles while the Fabric spike
  carries the schedule risk — the protocol half de-risked independently
  of the hard native half. It is a **disposable, non-normative
  vocabulary prototype**, operating under the M3 effect-safety boundary
  from its first effectful run (fixture accounts, denied external
  effects, reset semantics — safety is not deferred to M3): its results satisfy no native feasibility,
  operability, or certification gate, its verdicts declare which
  evidence level they witnessed (a DOM event injection is not a handler
  observation), and it doubles as the pilot for token-emitting codegen
  so the wrapper ergonomics are pressure-tested before M3 — with a
  preregistered output contract (the claim-syntax changes its
  vocabulary feedback can force before M3) and a mechanical sunset:
  the arm's code is not carried past the M0 schema freeze, so
  disposability is enforced rather than promised.
  Incidents are
  classified as *RASP-addressable* under a **mechanical, preregistered
  rule** — an incident qualifies iff the missing or wrong fact belongs to
  the §3.0 fact table at an evidence grade the incident's tooling
  demonstrably could not produce, reported as two separate figures — a *protocol-relevant fact gap*
  (some §3.0 fact was missing) and the stricter *RASP-addressable*
  (additionally: a plausible named producer exists and the missing fact
  was decision-relevant), so absence alone is never treated as economic
  solvability — with the M-1 brief binding the
  classifier to a **content-addressed fact-table/taxonomy version**:
  retroactive reclassification of the funding gate is forbidden, and any
  M0 definition change is reported as a new classifier version, never a
  rescore — and the classification is adjudicated
  by a party that is not the author (a partner reviewer or independent
  engineer, consistent with M2's named-oracle discipline), because
  "RASP would have caught this" is a counterfactual and this is exactly
  where sponsor optimism would otherwise enter. The fixture corpus
  itself is a nontrivial investment made *before* the fund/kill decision
  it feeds — stated plainly here so M-1's denominator is honest — but it
  is outcome-independent: the corpus, manifests, and cheap-arm results
  retain full value for outside-in tooling even if RASP dies at this
  gate. Because M-1 shapes the metric definitions, it is exploratory by
  construction; therefore the confirmation cases are **withheld and
  custodied before any M-1 execution** — the independent custodian
  receives a sealed slice of the corpus (and of field incidents) that no
  M-1 arm runs against and no metric/schema designer sees, with
  per-fixture exposure status and provenance recorded; a **held-out
  confirmation run** after M0 freezes definitions then validates the
  thesis on genuinely unseen data, against a preregistered comparator —
  the best cheap arm, with a preregistered minimum false-pass
  improvement RASP must clear. (If pre-M-1 custody proves impractical, a
  freshly collected post-freeze corpus is the fallback; splitting
  already-seen cases after M-1 is not held-out evidence.) Exit: a measured
  failure distribution and cheap-arm comparison that either fund the
  build or kill/reshape it.
- **M0 — architecture spike + schema draft + thesis decision.** The
  spikes are governed by a **normative decision matrix** — for each
  spike: core or optional layer, required success fact, which milestone
  it unlocks, the consequence of failure (proceed / narrow / descope /
  pivot / kill), the platform requirement (iOS, Android, either, both),
  and its permanent owner. The load-bearing rows:

  | Spike | Core/layer | On failure | Platforms |
  | --- | --- | --- | --- |
  | Host-semantic tree join (Fabric shadow node ↔ native view ↔ event descriptor ↔ root/window) + a diagnostic answer | **core** | blocks M1 | both |
  | Identity, coherence, attestation conformance cases (§3.0, §3.1) | **core** | blocks M1 | both |
  | Native-reachability producer (enumeration scope + residuals, point-resolution semantics, performance/legality assessment, deterministic higher-window and native-overlay negative fixtures) | **core** (the minimum core names reachability facts; universal — protocol integrity binds both theses) | **blocks M1 for both branches — the branch is chosen now, not after results**; the sole continuation is a *separately named, separately approved host-semantics-only pivot* available to either thesis, carrying no operability or completion language ever, with a reduced conformance obligation in which contributed driver-produced reachability facts are the only reachability source | both |
  | Component/Fiber provenance correlation | optional layer | descope the provenance extension; M1 proceeds | either |
  | In-process tier + ingress-identity propagation (§3.2) | layer (feeds `responderOperable`) | non-driver path disabled per platform; §3.4 contingency | per platform |
  | OS-driver correlation (bounded spike) | layer (feeds `osDelivered`/release profile) | release profile unattainable per platform; recorded | per platform |
  | Commit attribution under ambient noise | layer | descope to heuristic-informational (M2 rule) | per platform |
  | Obligation-closure + coverage-domain feasibility (build-sealed manifest; partition attainment estimate on real generated apps — below an M0-set floor, the sealed tier is descoped from M3 language, not carried as aspiration) | layer (feeds the claims tiers) | claims layer restricted to "declared scenarios verified" | n/a (build-time) |

  **M1's entry condition is stated in terms of the core technical rows
  plus the cross-cutting security gate (threat/principal-model
  approval).** M0 also builds one **executable proof-carrying vertical
  slice** — one route, one button, one native overlay, one action
  token, one attributed commit, one wrong-artifact case, every edge
  fault-injected — which exposes schema incoherence faster than broad
  interface design.
  The in-process spike's conformance list explicitly includes both a
  JS-responder-system gesture and a react-native-gesture-handler
  native-arbitration gesture per platform — RN's "responder routing" is
  architecturally plural, and timing cases alone do not cover the
  gesture stacks; test the compatibility seam across one adjacent RN/Expo
  SDK version — including the React DevTools plumbing if any is shared
  (§3.6), since that protocol has its own version-skew history; decide
  code ownership (Expo SDK module vs RN patch vs Fabric extension point
  vs upstream) with the maintenance burden actually measured, not
  assumed — inventory every hook the joins depend on (public / private /
  upstream / patched / Expo-owned), test a **representative supported
  SDK/RN window, not just one adjacent version**, produce an ownership,
  staffing, and compatibility-cost model (with per-milestone size bands
  for the decision brief), name the upstream-extension-point or
  maintained-patch strategy, and define the narrower host-semantic
  fallback explicitly if the minimum fact set proves to depend on
  brittle Fiber internals — this is §5's moat claim being *priced*, not
  presumed; run a **bounded OS-driver correlation spike** (XCTest/ADB
  ingress-identity feasibility) so Expo does not invest through M2/M3
  before learning `release-configuration-attested` is unattainable on a
  platform (preferring stable upstream extension points throughout —
  long-lived private Fiber/Fabric patches are a fallback carrying an
  explicit maintenance budget); **preregister the worst-case operability
  contingency** — if both the in-process and driver paths fail on every
  platform, the named consequence is either re-scoping the completion
  story to `semantic-development` + `nativePointReachable` under permanently
  qualified language, or killing the reliability thesis; decided and
  recorded at M0 like every other gate; and name the standing
  cross-version conformance owner;
  choose the governing thesis (Expo Agent reliability vs ecosystem
  standardization — or both: when both signals clear, the branches run
  concurrently with separate continuation ledgers and a shared-core
  cost-attribution rule set in the brief, so neither branch's spend
  subsidizes one that failed its own gate) and state kill/pivot
  criteria — **selecting the standardization thesis requires the
  written partner confirmation below; if partners report an existing renderer contract, the work
  reframes as interoperability, not protocol leadership — and selecting
  standardization also requires a protocol-governance decision:
  Expo-owned de facto standard vs RN-upstream contract vs joint partner
  governance, with contribution, compatibility, and deprecation policy
  named — and review from the RN renderer owner, since tool-consumer
  agreement is not a substitute for an upstream extension/versioning
  commitment** (renderer-owner *technical* review on seam feasibility
  and maintenance cost is sought under the reliability thesis too;
  only the governance decision is standardization-specific) (the reliability thesis needs no partner input); freeze the M1–M3 metric
  definitions and numeric floors **and preregister the held-out
  experiment in full** (train/tuning vs held-out corpus split frozen
  before implementation begins and **sealed under an independent
  custodian**; unit of analysis; a **joint primary endpoint** — false-pass
  rate at matched completion/obligation-resolution coverage, with every
  abstention class (`unresolvable`/`unsupported`/`timed-out`) counted,
  and a completion/resolution non-inferiority floor against the same
  comparator, so a conservative verifier cannot buy its false-pass number
  by abstaining on hard decisions; best-cheap-arm comparator; minimum
  effect; cost secondaries; **the concrete accept decision scored per arm** —
  for RASP at M2, obligation resolution over the acceptance truth
  table; for each cheap arm, its own named assertion surface — all scored
  against the same ground-truth labeling unit (fixture expected-fact
  manifests plus adjudicated field incidents), so the false-pass
  endpoint is computable without the M3 claims runner and the arms are
  genuinely comparable rather than asserted so; the kill/pivot consequence if the
  threshold is missed); publish the normative appendix (envelope,
  acceptance truth table, fixture manifests, and one end-to-end worked
  artifact — a snapshot fact, reachability fact, ingress receipt,
  handler token, attributed commit, claim verdict, attestation tuple,
  and coverage-ledger entry, plus the counterexample where one missing
  join flips the verdict to `unresolvable`) plus a 1–2 page decision
  brief for Expo/partner leadership; pick the real protocol name (§1). Landscape table validated with partners, including
  explicit *written* confirmation of the §2.1 load-bearing assertion (a
  two-question form — "does your tool consume a renderer-published,
  versioned semantics contract today?" / "if one existed, would you?" —
  so the confirmation is an artifact, not a meeting impression —
  supplemented by a **renderer-owner inventory** — and the check of the
  load-bearing assertion moves to *M-1 entrance diligence*, since if a
  supported contract already exists, even partially, the cheap arms and
  interoperability framing should know before the web prototype begins
  —: what supported
  inspection/semantics extension points RN itself already exposes, who
  owns them, and what versioning promise they carry, since "our tool
  does not consume one" does not by itself prove no contract exists;
  the external documentation is pinned and archived for the decision
  record); SwM + Callstack schema review sought. Exit (Expo-controlled only): the **core matrix rows** pass on both
  platforms; the five ownership decisions are made *separately* —
  code placement, program DRI, cross-version compatibility owner,
  attestation owner, and corpus amendment authority (plus the M2
  disagreement oracle named); thesis and protocol name decided;
  thresholds frozen; appendix published. Partner review is scheduled,
  not gating.
- **M1 — semantics tree + snapshots + annotated screenshots** in dev
  clients, iOS + Android, against the fixture corpus. **Entry condition:
  the §3.5 threat/principal model is approved.** Perf is a frozen budget,
  not a bare "measure": snapshot cost and observer effect (JS-thread
  occupancy / frame-time share during capture) within the M0 floors, with
  changed-set-driven serialization designed in from the start — Exact's
  actual experience was that naive per-read full-walk JSON serialization
  on the app's JS thread was a real problem that required a dedicated
  incremental-serialization workstream to fix (LLP 0321 B1, still
  flag-gated); RN apps are bigger and the fusion is costlier, so this is
  a starting constraint, not an optimization. Exit: an agent completes a
  10-step task by refs only; expected-fact manifest conformance (positive
  completeness); zero false passes on deterministic negative fixtures;
  correct-`unknown` classification and observer effect meet the M0
  floors; **negative security conformance tests pass** (unauthorized
  reads, Host/origin + DNS-rebinding attacks, token scope, redaction,
  production stripping); handle coverage (share of significant nodes with
  stable handles) reported; mis-targeting rate *by ladder rung* reported
  (the semantic-id-above-handles adaptation is confirmed with data, not
  assumed — with the reversal preregistered: a rung-level result worse
  than the Acto order flips the ladder back); the §3.0 attestation fixtures pass (wrong-project,
  stale-bundle, different-config, mixed-HMR, process-restart all fail
  closed); and a **cold-client discoverability fixture** passes — an
  agent with no prior RASP exposure must discover and correctly use an
  unfamiliar capability from the manifest and skill within a fixed
  tool/context budget (the LLP 0365 lesson is behavioral, not just
  mechanical: a correct manifest can still be badly surfaced).
- **M2 — receipts + diagnostics + shadow calibration.** Exit: on the
  fixture corpus, the agent diagnoses both a renderer-layout blocker
  (clipped/zero-size) *and* a higher-window/host-overlay blocker via
  `why_not_hittable` — semantic-only success is classified as suspect,
  never passed; **attribution accuracy** measured on ambient-noise
  fixtures (action-caused commits correctly attributed vs ambient commits
  correctly excluded) meets the M0 floor — this gate is fixture-scoped
  (runtime-synthesized input, where propagation is achievable); if the
  floor proves unmeetable on driver paths, the defined outcome is
  **descope, not kill**: attribution degrades to heuristic-informational,
  the gate re-scopes to the surviving facts, and only failure on
  fixture-scoped synthesized input kills (consistent with §3.2's
  de-risking statement); completion rate non-regresses against M-1 (the
  F2 ablation discipline); the **shadow-mode disagreement matrix** (RASP
  vs outside-in tools on identical runs, explicitly bidirectional — cases
  where the outside-in tool is right are the calibration gold) is
  recorded; a **human-interpretation test** runs (developers/agents
  shown evidence reports with degraded, contradictory, and qualified
  results must make the intended ship/no-ship decision — honest
  evidence that users systematically misread is still operationally
  unsafe); and **every disagreement is adjudicated against a named
  oracle** before RASP gates anything downstream; unexplained conflicts
  remain `contradictory`/`unresolvable`, and any RASP false pass blocks
  M3. **M2 exit is where the preregistered held-out experiment runs**:
  RASP against the frozen held-out corpus, scored on the M0-preregistered
  primary endpoint against the best-cheap-arm comparator and minimum
  effect — clearing it is the M3 entry condition; missing it triggers
  the preregistered kill/pivot consequence, not a threshold
  renegotiation. The run includes **leave-one-evidence-family-out
  ablations** (tree only; +reachability; +attestation;
  +receipts/causality) so the smallest evidence set that materially
  improves reliability is identified empirically rather than assuming
  the architectural MVP is the empirical one. Scope note: M2's held-out arm tests the **evidence
  protocol** (facts, receipts, diagnostics, obligations), explicitly
  independent of the claims *product* M3 introduces on top of it.
- **M3 — claims + `expo verify` (development scope).** Entry: the M2
  held-out gate cleared; **a verification-grade input mechanism**
  operational on at least one platform — the in-process tier is the
  *preferred* one because mutation suites need controllable, repeatable
  input, but if verification-grade OS-driver correlation lands first,
  driver-based mutations satisfy this entry (the M0 worst-case
  contingency fires only when *no* verification-grade mechanism exists
  anywhere). One asymmetry is normative: input-to-handler correlation
  does not supply the handler-to-commit edge `causes(...)` needs, so
  **generalized "done" additionally requires, per platform and outcome
  family, verification-grade expected-handler observation *and* the
  same-action outcome/commit edge** — where only input delivery is
  verification-grade, M3 ships claims and evidence reporting but does
  not gate generalized "done" (the M0 matrix and M2 descope rule carry
  the same distinction); and the **minimum scenario
  model specified** (setup steps, navigation/scroll/input actions,
  runner ownership and hosting — resolving OQ16 — settling semantics,
  coverage-ledger semantics, and how an unavailable external driver
  affects a verdict) before claims become a product commitment; and an
  **effect-safety policy** in force — the claims runner executes real
  presses, so before it may exercise consequence-bearing actions it
  requires an attested fixture/test-account or effect-interception
  boundary, capability and consequence authorization (the LLP 0271
  boundary: provenance never authorizes effects; capability confinement
  is load-bearing), trusted confirmation for destructive/costly
  effects, reset/idempotency/cleanup semantics, and **fail-closed
  verdicts when safe execution is unavailable** — with a
  destructive-external-effect fixture that must be denied and can never
  contribute to "done" (extending LLP 0278's fixture-providers-only generator contract — the
  denial fixture itself is RASP-new). Exit: Expo Agent gates
  "done" per the §3.4 certification profiles (`responder-operability`
  for consequence-bearing gestures by default; `semantic-development`
  only for labeled development checkpoints — semantic-only never
  satisfies any profile), **scoped to the platform(s) where the
  operability mutation suite has actually run**: with the in-process
  tier on one platform, M3 is explicitly a one-platform pilot and its
  "done" language carries that scope; generalized cross-platform claims
  require the suite on each advertised platform; the claim-kind
  distribution (`dispatches`-only vs `nativePointReachable` vs `responderOperable`
  share) is tracked alongside the weakening rate;
  and — because M2's held-out gate proves *protocol-fact* accuracy, not
  the reliability thesis — **M3 exit adds a preregistered
  agent-in-the-loop held-out gate before any M4 adoption**: actual Expo
  Agent generation/repair tasks run against RASP and the best cheap arm
  under matched budgets, the final ship/repair/completion decisions are
  scored against an independent product-outcome oracle with abstentions
  counted, using both a frozen comparator (reproducibility) and a
  contemporaneous best-current comparator (honesty); if that gate cannot
  be run, the governing thesis narrows from "Expo Agent reliability" to
  "truthful observability substrate" and says so. Claims face mutation
  tests: wrong-handler dispatch, unobserved required claim, correct semantic dispatch with a witnessed negative reachability fact
  (the probe reports the point does not reach the target), an
  unavailable reachability probe (must yield `unresolvable`, not
  `passed`), contested exclusive-input lease (must yield `unresolvable`),
  the §3.2 substitution cases (intended event dropped + sole ambient
  substitute; delayed prior event as sole ingress — both `unresolvable`),
  the composition failure (a witnessed positive reachability fact +
  semantic token success + broken responder path — must not pass
  `responderOperable`, **and must fail
  the default product-completion decision even when no stronger claim was
  manually authored**, via the consequence-bearing auto-escalation), the
  cross-action substitution (in-process operability proof for action A
  plus unrelated OS delivery for action B must not compose into
  `release-configuration-attested` for either), and missing driver evidence
  for `osDelivered` — each must fail the gate. Contributed driver evidence is consumed only after the §3.2
  adversarial cases exist. The tethered release-verification artifact
  (§3.5) is defined here; until it exists, all claims language is scoped
  to "verified in development," never "shipped."
- **M-Go — Expo Go gate (only if Go delivery is pursued).** Cross-project
  isolation conformance (evidence never crosses project, session, or
  device incarnations inside one Go host), per-project capability
  advertisement, and the Go payload budget (binary size, startup) met.
  Until this gate passes, the delivery promise is dev clients only.
- **M4 — ecosystem adoption (outcome, not exit-gate), scored per
  thesis.** The Expo-controlled deliverables: Expo MCP local tier rebuilt
  on RASP, the conformance suite + wire corpus published, cross-version
  conformance operating under its M0 owner, and the physical-device
  transport under the §3.5 threat model. Terminal scoring is
  thesis-specific: under the **reliability thesis**, Expo MCP + Expo
  Agent on RASP with measured false-success reduction is success even if
  both partners decline — but the strongest reliability claim available
  is **`release-configuration-verified`**: at least one end-to-end
  `release-configuration-attested` run (attested sibling + operability
  evidence) on each platform it covers, never phrased as shipped-app or
  store-byte language (§3.4); without that, terminal success is
  honestly narrowed to development verification.
  Under the **standardization thesis**, success requires time-bounded
  external adoption evidence (at least one non-Expo consumer or
  contributor in production within the window set at M0); absent that,
  the honest outcome is a *pivot to Expo-internal infrastructure*,
  recorded as such rather than relabeled success. After M2, calibration
  becomes an operating system, not a launch gate: a standing
  **false-success bounty** turns every field false pass or
  RASP/outside-in disagreement into a minimized replay, an
  expected-fact manifest, an evidence-gap classification, and a corpus
  amendment decision. If Expo adopts the
  architecture but trims the experimental apparatus, the
  **non-negotiable minimum** is: zero-false-pass deterministic
  negatives, the sealed held-out gate, fail-closed attestation, and the
  schema-linted result-presentation rule (a qualified result rendered
  as an unqualified pass defeats the other three) —
  without those four, the honesty claims in this document are
  unenforced and should not be repeated.

## 5. Risks and objections

- **"Fabric internals are unstable across RN versions."** True; this is
  why M0 decides placement/ownership, tests a representative supported
  SDK/RN window (not just an adjacent seam), prices the burden with an
  ownership/staffing/cost model, and names a standing conformance owner
  before the schema freezes. The
  implementation lives with the party that already absorbs RN version
  churn for the ecosystem (Expo SDK releases). That maintenance burden is
  also the moat — it is the cost that keeps outside-in tools outside.
- **"The runtime tree will certify things users can't do."** It will —
  that is the Partitime false-positive class, and rev 1 of this document
  had exactly this flaw. The design answer is §3.0/§3.2/§3.3/§3.4: native
  reachability is a separate, native-authority fact; input delivery is a
  contributor fact with a trust model; claim kinds declare evidence
  minima; and the operability gate cannot be satisfied semantically. The
  M2/M3 exits test this directly.
- **"Partners may not adopt it."** The fallback is stated in M4 and is
  still good: Expo MCP and Expo Agent alone justify the layer, and
  coverage-explicit runtime observation versus outside-in
  reconstruction is a visible quality difference that creates adoption
  pressure. M0 asks for review, not commitment; the
  conformance suite makes adoption verifiable when it happens.
- **"Perf overhead of maintaining and serializing the tree."** A real
  risk, per Exact's record (see M1). Dev-mode-only delivery bounds the
  blast radius but does not excuse the design work; the observer effect is
  itself a frozen M1 budget — and includes the gesture-claim
  reachability probe's per-iteration latency, since a probe developers
  route around shows up in the downgrade ledger late rather than early.
  The conformance corpus and expected-fact manifests are themselves
  version-coupled artifacts re-baselined every SDK cycle; that carrying
  cost is part of the moat's price and sits inside the M0 cost model.
- **"React's tree is emergent; identity is weaker than Contract's."** Yes
  — refs in a reconciled tree need care around keys, flattening, and
  virtualization. This is the hardest open design problem (§6) and the
  reason M0 prototypes identity before anything freezes.
- **"This could be a solution looking for a problem."** M-1 exists to
  answer exactly that with a measured failure distribution before build
  investment; the kill/pivot criteria at M0 are the honest exit.

## 6. Open questions

1. **Ref identity across reconciliation** — what composite survives keyed
   remounts, flattening, and virtualized recycling without silently
   retargeting? (Shared with Exact: LLP 0321 OQ10's slot-vs-item problem.)
2. **Where the semantics layer lives and who owns compatibility** — Expo
   SDK module, Expo-maintained RN patch, Fabric extension point, or
   upstream RN core; what RASP-version-per-SDK promise is made; how dev
   clients negotiate version skew between installed runtime and agent
   tooling. (M0 decides placement and names the owner; the promise needs
   ongoing governance.)
3. **Receipts under concurrent React** — how far can an action identity
   propagate through the commit pipeline (transitions, deferred updates)
   before facts degrade to `heuristic`? §3.2's de-risking statement says
   the layer survives a pessimistic answer; the question still bounds v1
   claims.
4. **Driver ingress correlation** — can XCTest/ADB paths carry a true
   ingress-propagated identity (or a shared exact event key) on either
   platform — and can that one identity survive the full path through
   responder/gesture handling to the expected action token and resulting
   commits? If not, `armed-bracket` (never verification-grade) is the
   ceiling for contributed input evidence, and `responderOperable` is only
   achievable via runtime-observable realistic input. What input
   classes the app runtime can actually witness during a diagnostic
   lease, per platform, sets the same floor.
5. **Snapshot coherence contract** — what skew bounds are guaranteed
   across React commit, mount transaction, native animation/scroll, window
   state, and screenshot capture, per platform?
6. **Claims registration binding (v2)** — what associates a claims
   declaration with a mounted instance across HMR remount, `memo`, and
   HOC wrapping; and what fact projection, per-instance scope, and
   redaction model makes state-guarded claims safe and executable?
7. **Library claims** — do RN component libraries ship claims for their
   own components (the analog of `@exact/facet-contract` components
   carrying contract blocks), using claim-local handles, and who owns the
   app-level registry?
8. **Organizational ownership** — which Expo team owns RASP (the Expo
   Agent team if the M0 thesis is reliability; a platform/SDK team if
   standardization), distinct from M0's *code*-placement decision?
9. **Production diagnostics** — is there a redacted, opt-in production
   tier (crash-adjacent semantics snapshots), or is that a separate
   proposal? (The M3 tethered release-configuration artifact is the
   nearer-term answer for release-build verification.)
10. **The completeness oracle beyond fixtures** — expected-fact manifests
    define faithfulness on the corpus; what defines a *faithful* (not
    merely useful) semantics tree on arbitrary real apps, and who owns
    extending the manifest set as RN grows new constructs?
11. **Shadow-mode adjudication ownership** — when RASP and an outside-in
    tool disagree on the same run, which named oracle (and which team)
    decides who was right, so M2's adjudication requirement has an
    owner rather than a queue?
12. **Fixture-corpus governance** — after M-1 the corpus becomes the de
    facto oracle for M2 adjudication and M3 mutation tests, and partner
    tools get scored against it; that is standards-body weight, and it
    needs an assigned owner and amendment process.
13. **Semantic-id lifetime contract** — what exactly resets a "root
    incarnation" in RN terms (reload, Fast Refresh, Android activity
    recreation), since that determines how often the ladder's top rung
    drops out from under a long-running agent session?
14. **Attestation ownership and the deferred exact-byte design** —
    which component owns the target/artifact attestation protocol
    (§3.0); what attests the release-configuration sibling's
    shared-input chain (EAS build inputs → sibling); and does the
    deferred exact-byte design (dormant authenticated channel, or
    two-artifact attestation of shared payload sections plus wrapper)
    ever get built, with what threat/size/privacy budget?
15. **Registration under Fast Refresh** — can v1 component-claim
    registration survive ordinary Fast Refresh without either silently
    rebinding or creating intolerable author friction? (Route-scoped
    claims dodge this; component registration does not.)
16. **Claims-runner hosting** — do claims execute in CI in v1 (dev
    client on simulator, driven how?) or only interactively under Expo
    Agent — and does the CI answer reintroduce a partner-driver
    dependency that the in-process tier was meant to avoid?
17. **Dev-loop survival under attestation-epoch churn** — Expo Agent
    iterates under Fast Refresh, and fail-closed attestation binds to
    the module/HMR epoch: what fraction of dev-loop verification
    attempts survive, and is the sanctioned workflow "fresh epoch, then
    verify"? M1's design confronts this rather than discovering it.

## Appendix: Revision History

This appendix is corpus-internal review provenance; it is dropped from
any externally shared rendering of this document. All revisions
2026-07-21, one entry per super-refine round response (newest first).

- **rev 23** (2026-07-22) — round-22 review response (Fable READY / Codex NOT READY): the standardization branch's demand gate operationally attached — **executable partner consumption, gated pre-M1** (at least one non-Expo design partner runs the schema/ledger and conformance corpus over its own recorded facts via a provided adapter and names an integration owner/timeline or ships a minimal adapter), with any native M1/M2 spend absent that gate explicitly labeled Expo-funded option value; the native-reachability failure consequence unified across all three locations — reachability is universal minimum core, failure on either required platform **blocks M1 for both branches**, and the sole continuation is a separately named, separately approved host-semantics-only pivot available to either thesis with contributed driver-produced reachability as the only reachability source and no operability language ever; branch concurrency stated (both may run when both signals clear, with separate continuation ledgers and a shared-core cost-attribution rule so neither subsidizes a failed branch); the §2.2 renderer-authority sentence narrowed (renderer state for renderer-owned clipping/sizing/stacking; native-host evidence for higher windows and chrome); the Phase A wording refined (consumes only that some press-family handler ran; the tap receipt's optional action/owner provenance is unconsumed); the `writeContractOk` scoping clarified (raw field exists for dev-registered instances generally; the verdict gate becomes contract-block-scoped through the verify-claims operation); and "whoever publishes first defines the schema" softened to an early coordination point whose adoption is a governance outcome.

- **rev 22** — round-21 review response (Fable READY / Codex NOT READY; the rnw-conditionality tension and the "those three" miscount found by both): the thesis split closed over the whole decision contract with a normative **thesis-by-milestone matrix** maintained as a content-addressed decision ledger — per gate/deliverable, required/optional/inapplicable under each thesis; a failed reliability gate kills only the reliability branch and never blocks a standardization program with its own demand signal; universal protocol-integrity requirements (zero-false-pass negatives, envelope conformance, fail-closed attestation, presentation rule) bind both branches while cheap-arm superiority and false-pass improvement are reliability-only economics; the react-native-web arm is a deliverable of the funded reliability build arms (conditional on M-1A), and the M0 vertical slice passes an unavailable optional attribution layer by representing the absence faithfully (absent/heuristic edge, `unresolvable` dependent verdict) rather than blocking the core; the external-contract validation scheduled once consistently (M-1 entrance archived-source + renderer-owner inventory; M0 written partner revalidation; partial-contract discovery auto-reframes to interoperability before any thesis-specific build approval); the summary paragraph's "exact-set" regression fixed (exact-set error enforcement for authored block clauses; asymmetric diagnostics for optional headers; syntax/name/purity validation of guards); "without those three" corrected to four; the Review-resting gloss softened to "closest available resting status"; the external-rendering drop extended to the Exact-defect parentheticals in the claim-kind bullets; fact-gap cards gain a producer-feasibility field (supported hook / upstream-plausible / maintained patch / unknown); the distribution-channel claim qualified to Expo-managed channels, not RN renderer ownership; and the §3.7 daily-use row carries its author-reported qualifier.

- **rev 21** — round-20 review response (Fable READY / Codex NOT READY): the M-1 gates made **thesis-specific and preregistered** — the reliability build arms (react-native-web prototype) gate on the addressable-prevalence threshold while the standardization arm (schema/ledger + partner appetite) proceeds on its own demand signal (entrance-diligence contract confirmation, concrete partner interest, compatibility-cost ceiling), so low Expo Agent failure prevalence kills the build arms without silencing standardization evidence and neither thesis can be revived post hoc; the Decision block's brief gains a **mandatory corpus-governance plan** for the sensitive M-1 data (default synthetic/internal or expressly authorized traces; source authority, consent basis, minimization, de-identification and secrets scanning, raw-data access and audit logging, retention/deletion, partner-export rules, conflict/recusal) with external or operationally independent custody/adjudication under a CEO sponsor, the apparatus itself as a ceilinged line item excluded from continuation arguments, and a pitch claim-strength fidelity check at second approval; the calibration precision items fixed (action-header writes are set-compared — under-declaration errors, over-declaration warns — with "exact-set enforced" reserved for authored block clauses; the accidental headerless gate scoped to contract-bearing components evaluated by the verify-claims operation); the schema-linted result-presentation rule joins the non-negotiable minimum (a qualified result rendered unqualified defeats the other three); M-1 classification reports *protocol-relevant fact gap* and the stricter *RASP-addressable* (named plausible producer + decision relevance) as separate figures; and each field incident is packaged as a privacy-preserving **fact-gap card** so partners adjudicate without receiving raw traces. Exact-side regression tests for the surfaced defects join the residue list.

- **rev 20** — round-19 review response (Fable READY / Codex NOT READY): the last post-result escape hatch pinned — native-reachability core failure **blocks M1 under the reliability thesis, with the branch chosen now**, and a host-semantics-only continuation is a separately named pivot requiring fresh approval that carries no operability or completion language, ever; the switcher-incident claim narrowed to what the record supports (semantic-mode tooling in use at the time; the LLP 0326 benchmark ran other tasks, not that incident); the M-1 addressability classifier bound to a content-addressed fact-table version with retroactive reclassification of the funding gate forbidden (M0 changes are a new classifier version, never a rescore); the status-tense wording fixed (sits at `Draft` until the loop completes; resting status `Review`); the `has`/`present` syntax relationship stated (has(selector) is the authored syntax; present names the predicate a has witness proves); the reachability scope wording made platform-contingent (own-window/keyboard visibility are M0-produced scope facts, not guarantees); a standing post-M2 **false-success bounty** added (every field false pass or disagreement becomes a minimized replay + manifest + evidence-gap classification + corpus amendment decision); and the corpus-internal §3.4 citations expanded to the seven implementing files so the paragraph's correctness is independently auditable.

- **rev 19** — round-18 review response (Fable READY / Codex NOT READY): the Decision block re-scoped honestly — the immediate ask is authorization to *prepare* the populated M-1 brief (numeric per-item and aggregate ceilings, sampling frame, kill/continue thresholds, named sponsor/custodian/adjudicator), with M-1 *execution* requiring a second approval of that brief; M-1 gains a blinded, stratified, denominator-bearing **ecological sample** of ordinary Expo Agent tasks (prevalence and base rates, kept separate from the adversarial corpus) and splits into **M-1A** (ecological baseline + cheap arms) gating **M-1B** (schema/ledger + react-native-web prototype) on a preregistered addressable-prevalence threshold; a **native-reachability core row** joins the M0 matrix (producer, enumeration scope and residuals, point-resolution semantics, performance/legality, deterministic higher-window/native-overlay negative fixtures — blocks M1 or explicitly narrows the core and thesis); **waiver semantics closed** (a waived consequential obligation blocks sealed/generalized verdicts or schema-forces `qualified`, waiver share carries an M0-set ceiling, each waiver records approver/rationale/artifact, and a mass-waiver mutation must fail); the **disclosure/retention axis** added to the normative envelope enumeration (display/persist/replay/export composed most-restrictive-wins — witnessed-but-forbidden is not an availability reason); the capability surface rebuilt on LLP 0365's actual design — an **authored intent/capability and GAP authority** (aliases, owner, expiry, remedy) joined bidirectionally to the generated registries, because a generated index cannot name absent capabilities; the precision items fixed (reachability captured immediately before dispatch against pre-action state; same-level *other-window* occlusion; visible:true on all Phase A selectors with interactable:true only from the state-visible lowering; the surviving "entirely omitted destructive action" mutation reworded to implemented-but-unmanifested); M0 gains the executable proof-carrying vertical slice with fault-injected edges; the load-bearing landscape check moves to M-1 entrance diligence; "react-native-web joins are easy" demoted to a timeboxed feasibility hypothesis; the opaque-duplicate-handle coverage fixture added (ambiguous targeting requires complete scope or sealed uniqueness); the partition-attainment estimate gets its decision rule (below an M0 floor the sealed tier is descoped from M3 language); the ladder adaptation's reversal is preregistered; and the react-native-web arm gains a mechanical sunset (code not carried past the M0 schema freeze).

- **rev 18** — round-17 review response (Fable READY / Codex NOT READY): the outbound lifecycle made LLP 0001-conformant without local redefinition — the document remains at `Review` as the author's position, moves to `Accepted` only when a named Expo decision authority approves a precisely scoped program with the decision artifact linked (the author alone never advances it), and a **Decision requested** block scopes the immediate ask to M-1 only with M0 gated on M-1's result and M1–M4 each requiring fresh approval (nothing in the status ever implicitly endorses the full program); the "adopts or adopts" typo fixed in the same passage; the two operational-experience superlatives qualified as author-reported (daily agent use; highest-leverage diagnostics); the M0 spike matrix gains an obligation-closure/coverage-feasibility row (claims tiers restricted to "declared scenarios verified" on failure; partition-attainment estimate on real generated apps reported); the conformance suite gains a result-presentation case (a qualified pass rendered unqualified fails conformance — Expo's linting cannot bind partner surfaces); the profile-level result type is closed and includes normative `qualified`; §3.4 terminology normalized (`present` single term; `unchecked` added to the live state list; Phase A's visible described as geometry-visible selection plus interactable expectations); a proof-directed evidence-acquisition planner and the production-vs-fusion placement rule added to §3.3; and RN renderer-owner technical review extended to the reliability thesis (only the governance decision is standardization-specific).

- **rev 17** — round-16 review response (Fable READY / Codex NOT READY): the sealed-verdict quantification gap closed — sealing closes declarations, not the behavioral space they quantify over, so each obligation now carries a **coverage-algebra domain model** (declaration identity x route-parameter/data partitions x precondition/state fingerprints x instance quantifiers x scenario inputs; coverpoints, finite partitions, cross-coverage, waived and unreachable bins, residuals), the sealed verdict is available only over sealed finite covered partitions (or an accepted equivalence argument), any unbounded/opaque/uncovered dimension restricts the result to "declared scenarios verified" with an explicit residual, and a same-token-passes-one-partition-fails-another mutation must not produce a sealed pass; the fourth surfaced Exact defect recorded (runtime `state hidden` is unsatisfiable while Phase A lowers `hidden` to visible-filtered absence); the `reachesTarget` vocabulary residue in the M3 fixtures replaced with witnessed reachability-fact language; the §3.4 Exact-baseline paragraph marked corpus-internal (dropped from external renderings, like the appendix); a dev-loop attestation-epoch-churn open question added (Fast Refresh survival rate; "fresh epoch, then verify"); the M0 normative appendix gains the end-to-end worked artifact with its missing-join counterexample; profile names, residual qualifications, and prohibited completion phrases become schema-generated and linted in every consuming surface; and M2 gains a human-interpretation test (evidence reports with degraded/contradictory/qualified results must produce the intended ship/no-ship decision).

- **rev 16** — round-15 review response (Fable READY / Codex NOT READY): the closure authority's limit made explicit — **the generated manifest closes implementation, not intent** (the generation authority cannot emit an obligation for a feature absent from its own inputs), so the verdict tiers: the manifest-scoped result is "build-sealed implementation obligations verified on ⟨platform/profile⟩" with unqualified "done"/"product complete" prohibited at every tier, and the stronger "sealed specification satisfied" requires an independently authored, frozen pre-build acceptance manifest attested alongside the artifact-derived one and reconciled bidirectionally (Expo Agent must never silently rewrite the standard its own output is judged by); the omission mutation restated satisfiably (an *implemented* destructive action omitted from the manifest must block; intent-level omissions are caught only at the specification tier); **an agent-in-the-loop held-out gate added at M3 exit** before any M4 adoption — actual Expo Agent generation/repair tasks vs the best cheap arm under matched budgets, final ship/repair decisions scored against an independent product-outcome oracle with abstentions counted, frozen plus contemporaneous comparators, and the thesis honestly narrowing to "truthful observability substrate" if the gate cannot run; the three Exact-baseline precision items fixed (the switcher hit was claimed by a topmost native overlay, not an ancestor view; Phase A's has/missing emits visible-filtered selectors so only the monitor approximates raw presence; guarded `when` emission is whitelist-based); the react-native-web arm operates under the effect-safety boundary from its first effectful run; M1's entry restated as core technical rows plus the cross-cutting security gate; the M2 held-out run gains leave-one-evidence-family-out ablations so the empirical MVP is identified rather than assumed; the schema split into a renderer-neutral evidence core with separately versioned Expo Router/EAS/Expo Agent extensions; the LLP 0278 effect-safety gloss corrected (extending its fixture-providers-only generator contract; the denial fixture is RASP-new); the disclosure-axis sentence tagged per LLP 0374 W5; and the two revision-churn garbled sentences repaired.

- **rev 15** — round-14 review response (Fable READY / Codex NOT READY): semantic-structure claims gain a **scope-completeness facet** (`complete`/`partial`/`opaque`/`unavailable`) — positive `has` witnesses pass under any coverage, `missing` passes only under complete coverage (no-match under incomplete ⇒ `unresolvable`), exact `count` requires complete coverage else reports a lower bound, with Exact's Phase A zero-match-passes-missing rule named as the unsafe precedent and four coverage fixtures added; the closed obligation universe gains its **closure authority** — generalized "done" is scoped to Expo Agent–generated Expo Router apps under a build-sealed, content-addressed, proof-carrying obligation manifest (codegen emits; providers contribute bounded submanifests; runtime reconciles; the attested artifact binds the digest; dynamic escapes disqualify; closure feasibility is an M0 experiment and M3 entry gate), with the honest statement that arbitrary RN has no closure authority (Exact's own navigation analysis marks React edges statically unclosable; `exits only` is authored, not inferred) and brownfield keeps "declared scenarios verified" permanently; the M3 causal asymmetry made normative — input-to-handler correlation does not supply the handler-to-commit edge, so generalized "done" requires, per platform and outcome family, verification-grade expected-handler observation *and* the same-action commit edge, and driver-only-input platforms ship claims and evidence reporting without gating generalized done; the expected token named in `responderOperable`/`causes` syntax (or bound to one unambiguous sibling `dispatches(token(...))`) with missing/ambiguous identity ⇒ `unresolvable`; non-loopback transports require authenticated encryption with channel binding and replay protection, and destructive confirmations are host-owned and bound to operation/target/principal/descriptor; the surviving §5 "lossless-vs-lossy" replaced with coverage-explicit phrasing; the ambient-same-coalesced-commit `causes` fixture added (fail closed when per-change provenance cannot distinguish); the probabilistic-evidence tier recorded as a rejected alternative (substitution is about identity, not frequency); custodian/adjudicator independence extended to evaluated tool vendors; the event-trace operation named as Exact's identity-minting op (an ordinary semantic tap does not mint); the dataflow-inspector gate reference corrected to the `writeContractOk`/`agreement` fields; Expo Router layout/group routes added to the route-instance conformance cases; the react-native-web arm given a preregistered output contract; probe per-iteration latency and corpus re-baselining carrying costs added to the M1 budget and M0 cost model; and the Revision History appendix marked corpus-internal (dropped from external renderings).

- **rev 14** — round-13 review response (Fable READY / Codex NOT READY): generalized product "done" gains a **closed obligation universe** — a revision-bound obligation-discovery algorithm computes the denominator (significant affordances/action tokens, reachable routes and task-critical edges, consequence classes, required outcomes; the LLP 0085 `exits only` precedent generalized), every obligation is exercised-and-passed or waived under audited policy, unknown/opaque/unvisited consequential items block, four omission mutations must block, and absent the closed universe the result is named "declared scenarios verified" with completion language prohibited; `responderOperable` explicitly certifies input plumbing, not product correctness, and a v1 **`press(x).causes(assertion)` causal-postcondition claim** is added (expected token + same-action `resulting-commit-attributed` join + assertion against the attributed state; provider/domain outcomes need authoritative mutation receipts per LLP 0278 or return `unresolvable`; six outcome fixtures) with consequence-bearing gestures requiring it for "done"; M3 entry gains an **effect-safety policy** (attested fixture/test-account or effect interception, capability and consequence authorization per LLP 0271's provenance-never-authorizes boundary, trusted confirmation for destructive effects, reset/cleanup semantics, fail-closed verdicts when safe execution is unavailable, and a destructive-external-effect fixture that must be denied); attestation made **compositional for the Expo artifact model** (native build, embedded and activated EAS Update identity + JS hash, asset graph, config/plugin inputs, runtime compatibility, HMR epoch, per-component invalidation, OTA activation/rollback/mixed-update/asset-mismatch fixtures) with the trust boundary stated (measured/signed detects mismatch among trusted participants; it is not device-integrity attestation); the literal claim names `nativePointReachable`/`responderOperable` adopted throughout; the precision pass landed (iOS probe enumerates strictly higher window levels in-scene with same-level/cross-process occlusion and DEBUG-only private-hook distribution legality as residuals; the staleness "role" field is the serialized element type/original tag; navigation receipts carry matched-declared-edge metadata, not an interaction-provenance join; DOM fallback = no handler observation; the 0374 attribution corrected to semantic-path-only ingress minting with commitId minting as 0374's flagged new work; the security-posture citation moved to docs/agent-api.md + the origin RFC; the Workstream E Related gloss re-pointed to §3.1 as pattern precedent); the Argent row's platform-scope inconsistency with LLP 0320's source notes recorded in the table; the evidence report upgraded to a two-axis verification manifest (proof strength × obligation coverage) so negative space is visible; standardization-thesis selection adds RN renderer-owner review; "lossless" softened to coverage-explicit; and the non-negotiable minimum moves onto the M-1 pitch's first page.

- **rev 13** — round-12 review response (Fable READY / Codex NOT READY; the `present` mislabel flagged independently by both): the interaction-evidence levels split three ways per code — direct semantic `press` witnesses some press-family handler; direct `change` witnesses **value injection/commit only** unless separately joined to handler evidence (Exact's type operation forcibly reports `dispatched: true` after commit even when the dispatcher found no Change binding — the third Exact defect this loop surfaced, recorded as residue); the DOM fallback witnesses event injection only — and RASP receipts carry distinct `valueCommitted`/`handlerObserved`/`nativeIngressObserved` fields instead of one overloaded boolean, with the react-native-web arm barred from promoting injection-only paths to `semantic-wired` and a no-Change-handler fixture proving the distinction; the provenance import restated as LLP 0271's *normative* model in full while naming what Exact actually ships today (taxonomy, hostile-ordering helper, hand-annotated tree slice; taint inference and per-span provenance deferred; coverage is new work); the `state` parenthetical fixed (`enabled`/`disabled`/`checked` live in Exact; presence via `has`/`missing`; `present` is RASP's term motivated by the conflicting `visible` implementations); the `semantic-development` table cell corrected to include the native point-reachability probe for gesture claims with probe-absent ⇒ `unresolvable`; the held-out custodian and incident adjudicator placed explicitly outside the sponsor's reporting chain (partner or external reviewer preferred — with a CEO sponsor, "non-author" alone buys no independence); the per-arm accept decisions scored against one shared ground-truth labeling unit (fixture manifests + adjudicated field incidents); verdict diagnostics generated as minimal-cut explanations from the proof graph; landscape sources pinned and archived with the M-1 pitch rather than at execution; and the literal claim names (`nativePointReachable`, `responderOperable`) stated as preferred, not merely candidates.

- **rev 12** — round-11 review response (Fable READY / Codex NOT READY; the provenance subset flagged independently by both): content provenance rebuilt to LLP 0271's shipped model *in full* — separate source-authority and authorship/intent axes, the complete eight-class vocabulary (`app`/`system`/`user`/`other-user`/`third-party`/`external`/`generated`/`data-unknown`), conservative most-hostile-wins effective-class derivation, laundering fixtures covering the previously omitted classes and conflicting axes, and the normative 0271 invariant that provenance is advisory and can never authorize effects or relax capability/consequence policy (capability confinement is the load-bearing layer); the `visible` misassignment fixed — `present`/`rendered` is the strongest semantic-only claim, and `visible` is a proof-graph claim over committed layout, viewport/clipping, mounted-native geometry, opacity/transform, and declared occlusion scope with residuals and six negative fixtures, with Exact's own incoherent precedent (Phase A lowers visible to interactable; the witness treats presence as visible) named as the cautionary tale; the dataflow inspector's accidental de facto gate on headerless actions stated (declaredWrites:[] exact-compare folded into the agent-facing ok) with RASP's authored-only rule made explicit; the DOM fallback's event-injection-only proof level stated, with the react-native-web arm required to expose which level it witnessed and demoted to a disposable, non-normative vocabulary prototype that satisfies no native gate (doubling as the token-codegen ergonomics pilot); M4's terminal wording corrected to `release-configuration-verified`; the scope-note lifecycle aligned with LLP 0001 (Superseded on adoption with a linked authority; Withdrawn on rejection without one); the capability surface rephrased to LLP 0365's relevant discovery shape with authority provenance and freshness obligations; the semantic id carried as {semanticId, lastSeenFingerprint} so slot reuse and handler/trust changes fail closed for snapshot-bypassing callers; the M0 preregistration names the concrete accept decision scored per held-out arm (RASP: obligation resolution over the acceptance truth table; cheap arms: their own named assertion surfaces); `userOperable` joins the M0 rename list (`responderOperable` candidate) under the naming-tracks-proof-strength rule; the M-1 pitch names actual people/teams for the three independence roles and the M0 brief costs the trimmed-to-minimum variant as a first-class option; and selecting the standardization thesis now also requires a protocol-governance decision (Expo-owned vs RN-upstream vs joint partner governance, with contribution/compatibility/deprecation policy).

- **rev 11** — round-10 review response (Fable READY / Codex NOT READY): M0's incompatible exit semantics fixed — the spikes are governed by a normative per-spike decision matrix (core vs optional layer, required success fact, unlocked milestone, failure consequence, per-platform requirement, permanent owner), the load-bearing rows are tabled (host-semantic tree join and identity/coherence/attestation conformance are core and block M1 on both platforms; component/Fiber provenance is an optional layer whose failure descopes the extension; in-process ingress, driver correlation, and attribution each carry their own per-platform consequences), M1's entry is stated solely in core-row terms, the M0 exit names the five ownership decisions separately (code placement, program DRI, compatibility owner, attestation owner, corpus amendment authority, plus the M2 disagreement oracle), and the in-process spike's conformance list gains JS-responder and react-native-gesture-handler arbitration gestures per platform; the three M-1 independence roles (sponsor/DRI, corpus custodian, incident adjudicator) are provisionally named before any M-1 execution; the scope note states this document can never become `Implemented` in LLP 0001's sense and moves to `Superseded` with a link to the Expo-owned authority once Expo decides; a `state` claim kind joins v1 (live in Exact today); the claim matcher is renamed `token()` to disambiguate from the `action()` authoring wrapper; public naming is committed to track proof strength (`nativePointReachable` as the M0 candidate for `userReachable`); a semantics-provider extension (LLP 0321 Workstream E pattern) is added for custom native components/brownfield/WebViews under producer identities and evidence ceilings with `opaque` as the default; the capability surface commits to the full LLP 0365 shape (intent aliases, runnable examples, anti-patterns, GAP entries) plus a declared schema-version skew answer; the release-configuration profile gains the instrumented-vs-uninstrumented differential run as perturbation-bounding evidence; the monitor semantics are stated precisely (per-invocation ⊆ vs static exact-set; "no observed write-set evidence"); the react-native-web arm is promoted to a named M-1 deliverable with its own exit; the weakening-rate metric gets a decision attached (token-coverage floor or explicit codegen-property scoping at M0); and the switcher-clicks example gains its concrete symptom sentence.

- **rev 10** — round-9 review response (Fable READY / Codex NOT READY): the profile↔mechanism contract made a normative table (per profile: input mechanism — either / driver-required — same-action join grade, and the consequence of unavailability), with profiles expanding to property-tested declarative proof obligations (counterexamples for monotonicity, cross-action substitution, missing evidence, insufficient-fact composition) and `osDelivered` explicitly in the release profile's expansion; M3's in-process requirement clarified as a controllable-mutation-mechanism preference — verification-grade driver correlation satisfies the entry too, and the M0 worst-case contingency aligned to fire only when no verification-grade mechanism exists anywhere; the held-out experiment made genuinely held out — confirmation cases are withheld and custodied *before any M-1 execution* with per-fixture exposure/provenance records, designers never see them until the M2 run, and a fresh post-freeze corpus is the named fallback; route-scoped claims given route-instance identity (declaration = pathname; evaluation and ledger bind to app/root incarnation + router entry key + mounted-route incarnation + params identity, with same-path-different-params, retained-inactive-entry, and multi-root conformance cases); the navigation precedent corrected from "specification only" to its actual three levels — static navigation-declaration checking ships (navigation-contracts.ts), live settled-route receipts against declared edges ship and attach to interactions (navigation-receipts.ts), and only the propagated action-token→transition join is new; the Contract mechanism descriptions tightened (no-write-obligation wording covers header *and* block-clause absence; guarded `when` live only over live-capable inner clauses; "Phase A live verification" split into read-only assertions and effectful interactions); §5's version-skew summary updated to the representative-window + cost-model mitigation; OQ9/OQ14's rev-8 naming/model residue fixed; the LLP 0278 Related gloss names the landed clause forms instead of quantifying over Part A; the weakening-rate metric given an M1 static proxy with the true rate starting at M3; the minimum viable core surfaced in §1; the §2.1 DevTools-protocol sentence added (closest existing thing; fails the bar on every relevant axis); the M0 spike table, renderer-owner inventory with archived documentation, claim-sketch handle-resolution note, third-party-component obligation sentence, and the tightened Acto ingress-identity wording (action-root ingress landed; end-to-end realistic-event binding remains new owner work) all landed.

- **rev 9** — round-8 review response (Fable READY / Codex NOT READY): the release-profile contradiction rev 8 introduced is resolved by choosing the honest construction — the profile is renamed **`release-configuration-attested`**, certifying an instrumented sibling built from the same source revision and effective configuration in release configuration, differing only by the verification channel, with shared/differing inputs attested at `measured`/`signed` class; because production stripping means the distributed bytes carry no verifier, v1 makes no claims about shipped store bytes, period — even the strongest profile authorizes only "release-configuration-verified," with exact-byte designs (dormant channel; two-artifact attestation of shared payload sections plus wrapper) deferred to §6; the rev 8 "runtime monitor is the only net" sentence corrected (the monitor checks only authored contract-block clauses; the dev dataflow inspector detects mismatches only on invocation; unvisited headerless actions produce no evidence at all) and the handler-identity sentence extended to `press`/`change`; M-1/M0 bounded — every item/spike carries a staff-week and calendar ceiling assigned in the funding brief, spikes are ordered by information value with preregistered stop/narrow/pivot outcomes, M0 becomes independently gated experiments, a named **minimum viable protocol core** (host semantics, identity, opaque regions, layout + native-reachability, attestation, conformance) is what still justifies M1 under pessimistic spike findings with Fiber provenance/claims/provenance-tainting/release certification as separately fundable layers, and post-M0 the strategy splits into separately governed specs with this RFC as the map, not the contract; a short-form M-1 pitch precedes the funding ask; the worst-case operability contingency (both input paths fail everywhere) is preregistered at M0 (re-scope completion to `semantic-development` + `userReachable` under permanently qualified language, or kill the reliability thesis); downgrade share gets an M0-set ceiling and downgrade audit gets a named approver and recorded artifact; the Acto probe scope split per platform (same-app on macOS, same-scene on iOS) with the full enumeration residual labeled new RASP behavior; the target-equivalence fingerprint anchored to Exact's shipped staleness fact list as the auditable baseline; route-scoped claims declared permanently first-class; upstream extension points preferred with private patches as a budgeted fallback; and M3 entry now requires the minimum scenario model (runner ownership/hosting resolving OQ16, settling, coverage-ledger semantics, unavailable-driver verdict effect) before claims become a product commitment.

- **rev 8** — round-7 review response (Fable READY / Codex NOT READY): attestation gains 0374 W1's **evidence-strength axis** — each attested field carries `self-declared` | `compared` | `measured` | `signed` plus authority/freshness/invalidation, profiles name minimum classes, loaded-bytes and configuration claims require `measured`/`signed`, and a self-reported-manifest-while-running-different-bytes fixture must fail; the release artifact model chosen explicitly — the profile is renamed **`release-candidate-attested`**, certifying the exact release-built candidate bytes (digest-chained from the EAS build, tethered dev-only channel, pre-submission), v1 makes no claims about distributed store bytes (an instrumented-sibling conformance case proves the digest obligation cannot be satisfied by a stand-in; the dormant-channel-in-shipped-binary option is deferred to §6 with its threat/size cost named), the profile's driver leg explicitly requires verification grade with the OQ4-pessimistic contingency recorded (profile unattainable on that platform, never quietly weakened), and M4's shipped-language scoping updated; the rev 7 `writes` claim corrected (it was false, caught by Codex with code citations that match the orchestrator's own round-2 verification): the action-header `writes` list is optional — no header, no static write diagnostics; when present, exact-set checked with undeclared-write errors and unused-declaration warnings; contract-block clauses optional and exact-set-error-checked when authored; for undeclared actions the runtime monitor is the only net; M0's compatibility test rebuilt to price the moat rather than presume it (full hook inventory across public/private/upstream/patched/Expo-owned, a representative supported SDK/RN window instead of one adjacent version, an ownership/staffing/compatibility-cost model with per-milestone size bands for the decision brief, a named upstream-extension-point or maintained-patch strategy, an explicit host-semantic fallback if Fiber internals prove brittle) plus a bounded OS-driver correlation spike so release-grade attainability is learned before M2/M3 investment; `responder-operability` gains an explicit qualified-status contract (always visibly qualified where an enumeration residual exists; never renderable or exportable as an unqualified pass through Expo Agent, CI, or durable artifacts); the Exact security precedent restated accurately (borrowed: loopback defaults, registration, Host/origin validation, authenticated effects and selected sensitive reads; RASP's gating of ordinary structure/screenshot reads deliberately strengthens a posture Exact does not ship); §2.2 item 4 narrowed to accessibility/semantic-snapshot diagnosability and the benchmarked tools; content-provenance class names aligned to LLP 0271's shipped taxonomy (`app`/`system`/`other-user`/`generated`/`data-unknown`) so laundering fixtures compose; a route-scoped `routeClaims` example now leads §3.4 with the component-registered form labeled second-phase; the M2 held-out arm's scope stated (evidence protocol, independent of the M3 claims product); a cross-action substitution mutation added (operability for A + OS delivery for B cannot compose into release-candidate certification); the input-fidelity vocabulary attributed to LLP 0306/adapter shape rather than a uniform tap result; schema/wire-corpus naming made independent of the interim RASP name; a react-native-web arm noted as a candidate cheap deployment surface for the protocol half; and the evidence-report artifact (claims × verdicts × facets × residuals, attestation tuple, ledger coverage) named as the user-visible output.

- **rev 7** — round-6 review response (both reviewers NOT READY; the consequence-classifier gap found independently by both): minting-vs-propagation corrected — the in-process tier's minted identity identifies the intended event only; verification-grade status requires per-platform proof that the same identity is bound to the concrete native event and observed at the action token (ambient/concurrent/dropped/diverted/delayed cases), with the non-driver `userOperable` path disabled on platforms lacking that proof, the Apple precedent stated accurately (`UIWindow.sendEvent` iOS / `NSWindow.sendEvent` macOS; Android `MotionEvent` is proposed RN work), and the tier table given LLP 0306's known-gap form; reachability facts declare a per-platform enumeration scope with out-of-scope occlusion reported as an explicit unverifiable residual (a system permission dialog can defeat both `userReachable` and in-process `userOperable`; the profiles now say so), the `userOperable` gloss qualified accordingly, and `physical-operability` renamed **`responder-operability`** with `release-attested` *requiring* OS-driver input (closing the cross-process residual) and alone entitled to shipped-app language, per platform; the consequence classifier named (provenance-bearing descriptor on the action token, Expo Agent codegen-emitted, lint-checked) with a fail-safe default — unclassified exercised interactive gestures are consequence-bearing unless explicitly downgraded — plus a coverage metric and an unlabeled-destructive-action mutation fixture; content provenance rebuilt to the LLP 0271/0374 W5 model (authorship and disclosure/redaction as separate axes; dynamic content defaults to hostile `data-unknown`; only static literals default `app-authored`; named authorities; taint/laundering fixtures before provenance gates anything); the held-out endpoint made abstention-proof (joint endpoint: false-pass at matched completion/obligation-resolution coverage, all abstention classes counted, non-inferiority floor, corpus sealed under an independent custodian); `navigatesTo` given the full causal contract (action-token observation joined at a named grade to an Expo Router transition + settled-route fact on the same attested run; ambient/timer navigation cannot pass; the Exact precedent labeled specification-only since Phase A ignores its navigation metadata) and a router-state row added to the §3.0 fact table; certification and milestone exits made per-platform (M3 = explicitly a one-platform pilot until the operability mutation suite runs on each advertised platform; M4 shipped-app claims require an end-to-end `release-attested` run per covered platform); the `writes` wording fixed (undeclared writes are a compile error; the contract-block clause is what's optional); passive invariants noted as root-mounted auto-watching; verdicts stated as attestation-bound; the manifest-drift limit acknowledged (registry drift impossible, behavioral drift beyond corpus coverage possible); a non-negotiable minimum named if Expo trims the apparatus (zero-false-pass negatives, sealed held-out gate, fail-closed attestation); and the revision history moved to this appendix (both reviewers, both rounds).

- **rev 6** — round-5 review response (both reviewers NOT READY; concerns disjoint but compatible): a **target/artifact attestation fact family** added per LLP 0374 W1 — every claim and receipt binds to the attested tuple (project, artifact digest, runtime version, effective configuration, process epoch), verification fails closed on mismatch/unknown, with wrong-project/stale-bundle/different-config/mixed-HMR/process-restart/dev-vs-release fixtures, and the source-native fact graph declared authoritative with any fused tree as a non-erasing projection plus a content-provenance axis (W5's prompt-injection boundary); the ordered "proof frontier" corrected to a **directed proof graph** (semantic-wired and native-hit-reachable are independent nodes; derived tier labels carry no authority, per 0374 W3 and Exact's causal-trace rule) with claims naming required nodes/edges/grades; the input-mechanism ownership contradiction resolved — RASP includes a runtime-owned **in-process responder-path delivery tier** (the RN analog of Acto's shipped LLP 0306 P1 windowSendEvent/touch-sequence tier, ingress-propagated by construction because the synthesizer mints the identity), §3.6's non-goal reworded to partner-owned *OS/device-level* synthesis, §3.0 gains runtime-witnessed-ingress and in-process-delivery rows, and per-platform feasibility is an M0 spike item; **certification profiles** (`semantic-development` / `physical-operability` / `release-attested`) expand mechanically to required facets, Expo Agent's generalized "done" requires `physical-operability` for consequence-bearing gestures via default auto-escalated `userOperable` obligations (the broken-responder case now fails the default completion decision with no authored stronger claim), and `semantic-development` can gate only labeled development checkpoints; claim scopes sequenced — route/root-scoped claims ship before component-registered claims to decouple the React identity risk — and a `press(x).navigatesTo(route)` claim kind added (Expo Router outcome claims, the LLP 0085 navigation clause family); stale-ref precision corrected — the graded/receipted path is flag-gated in Exact and its equivalence check is event-kind-only (a handler swap keeping `onPress` can stale-verify), so RASP defines a normative **target-equivalence fingerprint** (semantic/owner identity, action-token identity, interactable state, trust/consequence posture, reachability class) with swap/remount/trust/reachability fixtures and stale refs rejecting until fingerprint facts exist, and the §3.7 rows split accordingly; the **held-out experiment is attached to a binding gate** — fully preregistered at M0 (split frozen pre-implementation, unit, primary false-pass endpoint, best-cheap-arm comparator, minimum effect, kill/pivot consequence), run at M2 exit as the M3 entry condition; M-1 incident classification gets a **mechanical RASP-addressability rule with a non-author adjudicator** (the counterfactual-bias hole in the preregistration discipline, closed); written partner confirmation becomes a prerequisite for *selecting the standardization thesis* (with an interoperability reframe if an existing renderer contract surfaces) while the reliability thesis needs no partner input; §2.2 item 4 narrowed to undiagnosable-outside-in/undetectable-semantic (the switcher-clicks symptom was visible to real input); the two Exact-baseline qualifications landed (strict-mode opaque-import errors in pure/resource contexts; tap-receipt action/owner provenance as optional Contract-path dev-mode precedent); `userReachable` probes evaluate at the exercising scenario step; M1 adds ladder-rung mis-targeting and attestation fixtures; M3 adds claim-kind distribution tracking and requires the in-process tier at entry; M0 adds a 1–2 page decision brief; open questions add attestation ownership, Fast Refresh registration survival, and claims-runner hosting

- **rev 5** — round-4 review response (Fable READY / Codex NOT READY): the exclusive-input-lease hardening path to verification grade is deleted — armed brackets are **never** verification-grade, because bracketing proves uniqueness among observed ingress, not the identity of the sole observed event (both reviewers independently found the sole-event-substitution edge: driver input dropped/diverted while one ambient event arrives inside the bracket); leases remain diagnostic-only with geometry/timing consistency reported, and the substitution cases ("intended event dropped + sole ambient substitute," "delayed prior event as sole ingress") are required conformance fixtures yielding `unresolvable`; interaction evidence is now a named **proof frontier** (`semantic-wired` → `native-hit-reachable` → `responder-delivered` → `expected-handler-observed` → `resulting-commit-attributed`) so no overloaded operability boolean can overstate weaker evidence — `userReachable` is explicitly a counterfactual hit test that does not prove the responder path (per LLP 0306's semantic-mode gaps), a new `userOperable` claim kind requires real input causally joined at verification grade through native ingress to the expected action token, `osDelivered` alone is insufficient for operability, the M3 gate's certification is relabeled honestly as "semantic wiring + native reachability, verified in development," and a composition-failure mutation case (reachable + token-dispatched + broken responder path must not pass `userOperable`) joins the M3 tests; v1 reachability is scoped to point interactions (drag/pan need trajectory reachability, undesigned); receipts preserve Acto's requested/actual/servedBy input-fidelity fields; a cold-client discoverability fixture is added at M1 (LLP 0365's behavioral lesson, not just the mechanical manifest); the M-1 corpus cost is stated honestly with its outcome-independent reuse value, and the held-out confirmation names its comparator (best cheap arm) with a preregistered minimum false-pass improvement; the targeting ladder is scoped to in-session use with cross-run artifacts (replay, claims, codegen) pinned to author/claim-local handles, and Acto's order is cited as its documented preference; the v1 claims-registration loud-failure promise gets a mechanism sketch (module-scope token; HOC wrap and new-token remount fail registration); §3.1 states the three in-process representations have no supported Expo join today; the claims example is annotated claim-local; the name-keyed-API instance-identity argument is made explicit in §3.5; partner confirmation of the load-bearing landscape assertion becomes a written two-question artifact at M0; §3.7's reachability row is corrected to "shipped before and validated by Partitime"; §3.6's ownership cross-reference is tightened; and open questions add corpus governance, semantic-id lifetime, and the per-platform ingress-observability floor folded into the driver-correlation question

- **rev 4** — round-3 review response (Fable READY / Codex NOT READY): verification-grade delivery disambiguated — `osDelivered` now requires ingress-propagated identity or an exact platform event key, with `armed-bracket` acceptable only under an exclusive-input lease whose ambiguity protocol makes any competing ingress `unresolvable`, and native reachability is the default requirement for *every* user-gesture claim consumed by a "done" decision, with declared, audited exceptions that can never satisfy an operability assertion; the evidence envelope realigned with LLP 0374 and Acto's shipped crosswalk — availability is `witnessed|degraded|absent` with a separate reason class (`unavailable`/`unsupported`/`unobserved`/`evicted`/`timed-out`/`redacted`/…), redaction can be present-but-degraded, and an acceptance truth table plus conformance fixtures must prove degraded/evicted/timed-out/redacted evidence cannot satisfy required verification, published as a normative protocol appendix at M0; the Exact claims precedent tightened per code — instance-scoped witness evaluation loses instance identity at the public by-name agent join (same-name multi-instance behavior is now a required RASP conformance case), compile-time checking restated as exact-set verification of *authored, optional* declarations over analyzable IR with warning-only opaque-import boundaries and the runtime monitor as defense-in-depth, and Exact's tap receipts credited as partial precedent for action tokens (action/owner provenance exists but Phase A does not consume it); two Acto transcriptions corrected — the shipped ladder is ref → testId → label → viewId → coordinates with RASP's semantic-id placement now labeled a justified adaptation, and Exact resolves `clean` refs silently (receipted `clean` is new RASP behavior); milestones rebuilt as decision experiments — M-1 labeled exploratory with preregistered taxonomy/sampling/version pins, cheaper-alternative arms (handle-discipline + best-outside-in, devtools-only instrumentation) that RASP must beat, a schema-validator/ledger arm over existing outside-in facts, and a held-out confirmation after M0 freezes definitions; M1 gains threat-model approval as an entry condition, negative security conformance tests, expected-fact manifests for positive semantic completeness, and a handle-coverage metric; M2 disagreements require adjudication against a named oracle before RASP gates anything, any RASP false pass blocks M3, and the attribution floor gets a defined descope path (attribution degrades to heuristic-informational; kill only if fixture-scoped synthesized-input attribution also fails); M4 gets separate reliability/standardization terminal scorecards with time-bounded external-adoption evidence, internal completion counting as success only under the reliability thesis; delivery narrowed to dev clients until a dedicated Expo Go compatibility/isolation gate (with a Go payload budget) passes; New-Architecture-only scope stated; the authoring-side action-token surface sketched with the weakening rate as a tracked metric; v1 claims registration fails loudly under HMR remount; the RASP rename is an M0 exit requirement with candidates named; DevTools-plumbing version skew added to the M0 seam test; §3.1 source ownership clarified (shadow tree = renderer identity + layout intent; mounted native identity joined from the native registry)

- **rev 3** — round-2 review response (Fable READY / Codex NOT READY; Codex's code-level findings adjudicated as correct where the two conflicted): the evidence model is now a normative envelope separating domain outcome, evidence availability, causal join method, producer status, producer incarnation, and freshness/coordinate space — witnessed negatives are distinct from missing evidence, expected-but-unwitnessed legs are explicit obligations, and snapshot bundles declare per-source revisions with coherent/skewed/contradictory/unavailable states (contradiction is a result, not normalized away); claim kinds now declare minimum evidence facets (`dispatches` = semantic only; `userReachable` requires a native-reachability witness with unavailable ⇒ unknown, never reachable; `osDelivered` requires correlated driver evidence) and the M3 operability gate cannot be satisfied by semantic-only success, resolving rev 2's contradiction with §5; driver correlation is downgraded honestly (only ingress-propagated identity is "exact"; prepare/arm is single-use-nonce bracketing) and contributed evidence gets a trust model (contributor principals, channel binding, replay prevention, per-contributor evidence ceilings) with adversarial fixtures gating M3 consumption; identity semantics reconciled with Acto's shipped design (every node has a semantic id, refs only for addressable nodes, the ladder includes the semantic id, staleness returns receipted clean/stale-verified for verifiably-unchanged targets, and subtree-precise staleness is labeled implemented-but-flag-gated in Exact); root-scoped app handles separated from claim-local handles for reusable components, with the Exact subtree-verification precedent marked partial (the Phase A selector runner is root-scoped); the Exact claims baseline corrected against current code rather than LLP 0278's older summary — live expression-valued counts, live `change`, live guarded `when` with guard-false skip verdicts, passive invariants, and runtime action-writes monitoring all exist today — and restated as a mechanism matrix; milestones rebuilt as investment gates (M-1 baseline of current Expo Agent + outside-in tools on the same corpus including real false-success incidents; M0 chooses the governing thesis, freezes metric definitions and thresholds including zero-false-pass on deterministic negative fixtures, tests the compatibility seam across an adjacent SDK version, states kill/pivot criteria, and separates Expo-controlled engineering exits from partner review; M2 makes observation-economics report-only and adds attribution accuracy under ambient noise plus shadow-mode disagreement calibration against outside-in tools; M3 is explicitly development-scope with a tethered release-verification artifact required before any "shipped" language; M4 treats partner adoption as an outcome, not an exit); terminology switched to "OS-driver-delivered input"; redaction extended to text, input values, screenshots, scenarios, and receipt history; the capability manifest is generated from operation/evidence registries and validated against the conformance corpus; §3.7 rows corrected (why_invisible marked new RN work; subtree-precise staleness split out; claims row upgraded); the RASP acronym collision with Runtime Application Self-Protection flagged for rename; the Expo Agent internals claim moved inside the sourcing envelope; claims-registration binding named as distinct from dispatch attribution and scoped to v2; a minimum-viable-fact-set de-risking statement added; the scope note gains a handoff clause making this a dated source document once Expo decides

- **rev 2** — round-1 review response: RASP recast as a provenance-bearing evidence protocol; Partitime false-positive class designed in; receipt economics restated per LLP 0326; unsupported Acto-origin history removed; LLP 0032 provenance corrected; perf-risk answer rewritten around the B1 incremental-serialization lesson; claims API made executable; M0 changed to an architecture spike; development threat model added; fixture-corpus milestones; landscape sourcing; capability provenance matrix added

- **rev 1** — initial draft from the 2026-07-21 Exact→Expo lessons conversation
