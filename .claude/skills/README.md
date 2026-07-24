# Claude Code Skills

Shared team skills for triaging and reviewing external PRs on expo/expo.

## Prerequisites

- [Bun](https://bun.sh/) runtime
- `GITHUB_TOKEN` env var — a GitHub personal access token with scopes: `repo`, `read:org`
  - Used by both the TypeScript scripts (direct API calls) and `gh` CLI
  - `gh auth login` also works — the scripts read `GITHUB_TOKEN`, and `gh` commands use the logged-in session

## Skills

### `/prs-triage`

Fetches open external PRs, scores them by author trust / diff risk / scope sensitivity, and ranks by quick-win and community impact. Optionally reviews top candidates via `/deep-code-review`.

By default, only shows PRs that touch files in your `.github/codemention.yml` patterns or are assigned/review-requested to you. Username is auto-detected from your GitHub token.

```
/prs-triage                  # triage PRs relevant to you
/prs-triage --unfiltered            # triage all external PRs
/prs-triage --review         # review top N from the latest triage run
/prs-triage --dry-run        # list PRs without scoring
```

### `/deep-code-review`

Context-first code review. Explores the codebase around changed areas before critiquing, then posts structured inline feedback as a PENDING GitHub review draft.

```
/deep-code-review <PR_URL>
/deep-code-review <PR_URL> --iteration 2
/deep-code-review <PR_URL_1> <PR_URL_2>     # stacked PR series
```

## Team workflow

### Triage rotation

Run `/prs-triage` on a regular cadence (daily or 2x/week). The on-call person triages, reviews the top quick-wins, and posts PENDING review drafts. Before submitting, always review the draft on GitHub — edit or delete comments as needed, then submit.

### Ad-hoc reviews

Any team member can run `/deep-code-review <PR_URL>` for a PR they're looking at. The review is posted as a PENDING draft so you can edit before submitting.

### REJECT flow

For AI slop, spam, or fundamentally unfit PRs: Claude assigns a REJECT verdict and offers to close the PR with a short comment. No inline review is posted — just a comment explaining why, then the PR is closed. Always confirm before closing.

### Key rules

1. **Every AI review is a draft.** Always inspect on GitHub before submitting.
2. **Never auto-approve.** The skill posts PENDING reviews — a human must submit.
3. **REJECT = close, not review.** Don't waste time on inline comments for spam.

## Configuration

- `prs-triage/config.json` — repo, internal contributors list, sensitive paths, scoring thresholds
- Keep `internal_contributors` up to date when team members join or leave.
