---
name: prs-triage
description: Triage PRs on expo/expo - scores by author trust, diff risk, and scope sensitivity, then reviews top candidates for merge readiness
---

# PRs Triage

Triage open PRs on expo/expo. A TypeScript script scores each PR on author trust, diff risk, and scope sensitivity. Then optionally review the top candidates via `/deep-code-review`.

## Usage

```
/prs-triage                            # triage + offer to review top PRs
/prs-triage --review                   # skip triage, review top N from latest triage JSON
/prs-triage --limit 50                 # limit PR fetch count (default: 100)
/prs-triage --offset 300               # skip first 300 PRs (paginate through older PRs)
/prs-triage --dry-run                  # list PRs without scoring (quick volume check)
```

## Configuration

`config.json` (next to this SKILL.md):

- `repo` — target repository (default: `expo/expo`)
- `output_dir` — directory for triage/review JSON output (default: `./triage`, relative to skill dir)
- `internal_contributors` — GitHub logins to exclude from triage
- `sensitive_paths` — file path patterns that elevate risk tier
- `tier_thresholds` — numeric thresholds for scoring

## Flow

### Phase 1-3: Fetch & score (`fetch.ts` + `prioritize.ts`)

Run from the skill directory:

```bash
cd .claude/skills/prs-triage
bun run triage                                          # default: fetch + prioritize
bun run fetch.ts --limit 50 && bun run prioritize.ts    # with flags (pass flags to fetch.ts directly)
bun run fetch.ts --dry-run                              # dry-run (don't chain prioritize — no JSON to read)
```

Requires `GITHUB_TOKEN` environment variable. `bun run triage` runs `fetch.ts` then `prioritize.ts`.

**`fetch.ts`** (all API calls):

1. Fetches all open PRs, filters out internal contributors
2. For each external PR, fetches author profile, merged PR count, recent open PRs, and file list
3. Fetches PR engagement data (reactions, comments) and linked issue details
4. Computes a composite score (0-100) from three sub-scores:
   - **Author Trust (40%)** — prior merged PRs, account age, followers, public repos
   - **Diff Risk (35%)** — diff size, file count, linked issue, includes tests, net deletions
   - **Scope Safety (25%)** — docs/test-only bonus, sensitive path penalty, native code penalty, new deps penalty
   - **AI penalty** — deducted for: new account + first PR, generic AI phrases in large diffs, spray-and-pray pattern (>5 open PRs in 7 days)
5. Assigns tiers: **Tier 1** (>=70), **Tier 2** (40-69), **Tier 3** (<40)
6. Writes sorted JSON to `{output_dir}/fetch.json` (overwritten each run)

**`prioritize.ts`** (no API calls, instant):

1. Reads the latest fetch JSON
2. Computes **Quick Win** and **Impact** scores for all PRs
3. Writes `prioritize.json`, prints ranked tables

Both scripts print to stdout. Present the **prioritize.ts** output to the user (quick-win and high-impact tables — these include tier info). The fetch.ts per-tier listing is verbose; skip it unless the user asks for details.

PRs tagged `*NEW*` weren't in the previous triage run. PRs tagged `*REVIEWED*` have already been reviewed by an internal team member on GitHub. On repeat runs, highlight new PRs and skip reviewed ones when selecting PRs for review.

### Phase 4: Review

After presenting the triage results, ask the user: **"Want me to review the top N?"** (default N: `max_prs_to_review` from config, initially 3). Pick from the prioritize JSON, sorted by quick-win score descending, Tier 1 first then Tier 2.

If the user invoked `/prs-triage --review`, skip Phases 1-3 and read `{output_dir}/prioritize.json` directly.

**This phase delegates to the `/deep-code-review` skill.** Must run from the expo/expo repo checkout.

For each selected PR, launch a **background subagent** (Agent tool, `run_in_background: true`) with the prompt: `Run /deep-code-review <PR_URL>`. Launch all reviews in parallel, then collect results as they complete. Map each verdict to a triage recommendation:

| deep-code-review verdict                | Triage recommendation                                  |
| --------------------------------------- | ------------------------------------------------------ |
| APPROVE with 0 critical/design findings | **APPROVE_AND_MERGE** — safe to merge as-is            |
| APPROVE with design findings            | **APPROVE_WITH_COMMENTS** — merge after nits addressed |
| COMMENT                                 | **NEEDS_MAINTAINER** — needs human expert judgment     |
| REQUEST_CHANGES                         | **NEEDS_CHANGES**                                      |
| REJECT                                  | AI slop or otherwise unfit changes                     |

For PRs with AI-risk flags from triage, apply extra scrutiny: even if deep-code-review says APPROVE, downgrade to APPROVE_WITH_COMMENTS and flag the AI-risk concern.

After all reviews:

1. Show a table with triage recommendation for each reviewed PR (include a link to the PR)
2. For NEEDS_CHANGES/REJECT, show key findings from the deep-code-review output
3. Post all reviews as PENDING drafts to GitHub (deep-code-review does this by default)

## Ignoring PRs

To skip PRs on repeat runs, add their numbers to `.ignore-prs` (next to config.json), one per line. Lines starting with `#` are comments. Example:

```
# Already reviewed, waiting on author
12345
12400
```

The AI can add PRs to this file when the user says "skip this one" or "I've already reviewed that."

## Guidelines

- Be skeptical of large PRs from new contributors
- Weight author history heavily — prior merged PRs is the #1 trust signal
- Flag PRs that touch native code or CI workflows for human review regardless of score
- NEVER auto-approve any PR!
