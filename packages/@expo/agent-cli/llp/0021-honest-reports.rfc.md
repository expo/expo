# 0021: Honest reports

**Type:** RFC
**Status:** Active
**Systems:** every command that prints a claim (`src/utils/errors.ts`, `src/utils/runnerLock.ts`, `src/utils/wrapperCrash.ts`, `src/runtime/reload/`, `src/dev/`, `src/status/`, `src/impact/buildCache.ts`, `src/needsHuman/`, `src/deploy/`, `src/typecheck/generatedTypes.ts`, `src/passthrough/auth.ts`, `src/followups/`)
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-27
**Revised:** 2026-08-30
**Related:** [[0004-smart-start-and-project-state]], [[0005-runtime-loop-tools]], [[0008-guardrails]], [[0010-agent-conventions]], [[0011-impact-and-freshness]], [[0015-backend-selection-and-config]], [[0016-v1-scope]]

## Summary

The CLI had the right data and printed the wrong claim. These fourteen rules are what a command may say, and about what.

## The rules

1. **A flag that names a target is the target.** If the caller passed `--port 8195`, act on 8195. The lock for another port is detail, never the thing you signal.
2. **A claim is about the moment it is printed.** Readiness from two seconds ago is not readiness. Write the report after the waits.
3. **One subject, one answer.** An answer about one platform, one build, or one process is never copied onto its siblings. They get a stated non-answer.
4. **Read the tool's own sentence before guessing.** A guess is allowed only where nothing was recognised, and it must say it is a guess.
5. **A note nobody reads is not a note.** If `--json` has a failure reason, the text report must print it too.
6. **A generated file is not a mistake in the code.** A gate red for a file no human wrote must say what generates it.
7. **Two questions get two answers.** "Is my app up to date" is a question per backend. One axis answering for both is the same mistake as one platform answering for both.
8. **Advice is about the device the loop is on.** A cloud loop is not a local loop with a longer wire. Follow-ups that need `--cloud` carry `--cloud`.
9. **A string this CLI prints is a string that works.** Relaying another tool's URL unchecked is relaying a URL nobody can open.
10. **An observed signal, or the band.** Name a verifying signal only when that signal's own evidence is in the payload and non-empty.
11. **The runner is not the service.** A tool this CLI chose to reach another tool through is a third party. Do not quote bunx install progress as what EAS said.
12. **A crash is a tool error.** An unexpected failure of this CLI is exit 1 with what happened, never a code that promises something else.
13. **What a command could not do is part of its answer.** A report that lists what happened and omits what was refused, skipped, or unaccounted for reads as a run with nothing left over.
14. **A message is not a tail.** The reason a tool gave is the sentence it wrote, wherever on the stream it wrote it. "The last ten lines" quotes the stack and drops the cause.

## How they show up

`--port` on `dev:stop` is rule 1. `src/dev/portListener.ts` decides whether that port is in use with a bind, not with a lock for a different port.

A detached `dev --wait-ready` that prints `Bundler ready` and then dies is rule 2. The report is written after the wait, and a later crash is a later claim.

A detached `dev --detach --ios` **without** `--wait-ready` that prints `Dev server <url> · detached` over a pid and exits 0 is the same rule, and the correction of 2026-09-03. The grace window that catches the late macOS Automation refusal was gated on `ready === true`, on the reasoning that a run which asked for no readiness claims nothing — but a URL, a pid and exit 0 are a claim, and live that pid was gone with nothing listening inside the second [observed — macOS 25.5, no Automation grant, 2026-09-03: exit 0 beside a `curl` of the printed URL answering 000]. The hazard belongs to the plan step that opens the app, not to the flag, so `needsOpenPlatformGrace` now declines only a run that has already failed. What such a run may be failed _on_ is narrowed to the two facts that are conclusive without a readiness claim — a handoff block in the child's log, and a child that is gone — because a bundler that has not answered yet is the ordinary state of a first compile. The cost is real and is paid by the runs that need it: a healthy `dev --detach --ios` now spends the grace window before it reports, and only a plan step that opens the app pays anything at all.

Copying one EAS build's fingerprint comparison onto both platforms is rule 3. `src/impact/buildCache.ts` answers per platform.

`deploy` classifying EAS failures is rule 4. `src/deploy/easFailure.ts` reads the EAS CLI's own sentence first.

A generated `expo-env.d.ts` failing `typecheck` is rule 6. The report names the file that generates it.

`status` freshness vs an EAS build for the same hash is rule 7. Local and cloud are two answers ([[0011-impact-and-freshness]]).

A cached fingerprint reported as a live measurement is rules 2 and 10. [[0023-fingerprint-caching]] requires the report to say which check ran and how old the hash is.

Skills sync that could not link a name and omitted it from `--json` is rule 13. The payload has a `skipped` list.

## Testing

Each rule is pinned next to the command that broke it. Unit tests assert the sentence, not only the id. Live suites in [[0022-live-tier]] catch the cases a stub cannot: a wrapper's panic quoted as EAS, a cloud follow-up printed for a local device, a cached hash spoken in the present tense.
