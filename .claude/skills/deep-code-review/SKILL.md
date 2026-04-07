---
name: deep-code-review
description: In-depth design-focused code review - understands codebase context before evaluating PR changes, posts structured feedback to GitHub
---

# Deep Code Review

**Core principle: Context before critique.** Never evaluate changes without understanding the existing architecture.

## Usage

```
/deep-code-review <PR_URL>
/deep-code-review <PR_URL> --iteration 2
/deep-code-review <PR_URL_1> <PR_URL_2> ... <PR_URL_N>
```

When multiple PR URLs are provided, the skill treats them as a **stacked PR series** and reviews each PR with awareness of the full stack.

## Phase 1: Fetch & Context

**Fetch PR metadata and diff** (for each PR, run in parallel):

```bash
gh pr view <PR_URL> --json title,body,additions,deletions,changedFiles,author,headRefOid
gh pr diff <PR_URL>
```

**For stacked PRs:** The URLs are provided in stack order (bottom to top — first URL is closest to main). Fetch all PRs in parallel, then build a cumulative change map tracking which files and symbols are introduced/modified at each level. This lets you tell which PR "owns" a change vs. which PR depends on it.

**Targeted exploration** - only investigate what's directly relevant to the changed code:

- Read current versions of changed files
- Find direct callers/consumers of modified APIs
- Search for similar patterns if the PR introduces new ones
- Check existing tests for changed modules

Use Agent(Explore) for architectural context, but scope it narrowly to the changed areas. For stacked PRs, use parallel sub-agents to explore each PR's changed areas concurrently.

**Do NOT exhaustively explore** the entire codebase. Focus on what's needed to evaluate the PR(s).

## Phase 2: Analyze

Evaluate the diff against the context gathered. Single checklist:

- **Design fit** - Respects module boundaries? Follows existing patterns and claude.md file for the modified package (if present)? Appropriate abstraction level?
- **Complexity** - Simplest viable solution? YAGNI violations? Over/under-engineered?
- **Correctness** - Edge cases handled? Race conditions? Resource cleanup?
- **Security** - Input validation? Injection? Auth? Secrets exposure?
- **Performance** - Unbounded growth? Blocking operations?
- **Testing** - Coverage adequate? Happy path + edge cases + error cases?
- **Breaking changes** - API contracts preserved? Migration needed?
- **Stack coherence** (stacked PRs only) - Does the aggregate diff across the stack make sense as a whole?
- **Adversarial examples** - Study the public API and any example code in the PR(s). Devise alternative examples that exercise edge cases, misuse the API, or pass unexpected inputs. Report any that produce bugs, crashes, or incorrect behavior.

For each finding, classify severity:

- `critical` - Security, data loss, breaking changes. Must fix.
- `design` - Architectural concerns, pattern violations. Should fix.
- `suggestion` - Improvements worth considering. Nice to fix.
- `nit` - Minor style/readability. Take it or leave it.

## Phase 3: Output

Write findings to `.claude/skills/deep-code-review/code-review-{pr_number}.json` (one file per PR, in the skill directory). The `summary` field **must** start with `_🤖 This is an automated review. Addressing it doesn't guarantee a merge._` — this is required so readers know the review is AI-generated.

```json
{
  "pr_url": "https://github.com/owner/repo/pull/123",
  "owner": "owner",
  "repo": "repo",
  "pull_number": 123,
  "summary": "Brief review summary in markdown. Must start with: '_🤖 This is an automated review. Addressing it doesn't guarantee a merge._'\n",
  "verdict": "APPROVE | REQUEST_CHANGES | COMMENT | REJECT",
  "comments": [
    {
      "path": "src/foo.ts",
      "line": 42,
      "side": "RIGHT",
      "body": "Description with reasoning (do NOT include severity labels in body — the posting script prepends them automatically from the severity field). Be concise.",
      "severity": "critical",
      "line_content": "unique substring from the target line"
    }
  ]
}
```

**IMPORTANT — `line_content` field:** Always include `line_content` with a unique substring from the target line of code. The posting script fetches the PR diff, searches for this substring, and resolves the correct line number — protecting against miscounted line numbers. The `line` field is used as a hint when multiple matches exist. During preview, the script shows the actual code at each target line so you can verify placement before posting.

**NEVER use `gh pr review` to post reviews.** It always submits immediately (publicly visible). Only use `post-review.ts` which creates proper PENDING drafts via the GitHub API.

After writing the JSON file(s):

1. Show the user a summary: verdict, comment count by severity, and key findings. For stacked PRs, show a brief stack-level overview first, then per-PR summaries.
2. User can inspect/edit the JSON at the temp path(s)
3. Preview what will be posted: `bun run .claude/skills/deep-code-review/post-review.ts preview .claude/skills/deep-code-review/code-review-{pr_number}.json`
4. Stage the review as PENDING: `bun run .claude/skills/deep-code-review/post-review.ts post .claude/skills/deep-code-review/code-review-{pr_number}.json`
5. The user can then edit inline comments on GitHub before submitting
6. Submit from GitHub UI, or via CLI: `bun run .claude/skills/deep-code-review/post-review.ts submit .claude/skills/deep-code-review/code-review-{pr_number}.json <review_id> [APPROVE|REQUEST_CHANGES|COMMENT]`

For stacked PRs, run preview/post for each PR in stack order. Each PR's summary should note its position in the stack (e.g., "PR 2/4 in stack") and reference other PRs in the stack where relevant.

**REJECT verdict:** Use for AI-generated slop, spam, or PRs that are fundamentally unfit (wrong repo, completely unrelated changes, etc.). REJECT PRs skip the review entirely — no inline comments are posted. After showing the verdict table, offer to close the PR: `bun run .claude/skills/deep-code-review/post-review.ts close .claude/skills/deep-code-review/code-review-{pr_number}.json`. This comments the summary on the PR and closes it. Always confirm with the user before closing.

## Iteration Support

When `--iteration N` is specified:

1. Fetch new commits since last review: `gh pr view <PR_URL> --json commits`
2. Check conversation for addressed comments: `gh api repos/{owner}/{repo}/pulls/{pr}/comments`
3. Re-analyze only changed areas; acknowledge fixes, flag new issues
4. Write a new JSON file and post as usual

## Guidelines

**Review should be concise.** A 4-line docs fix does not need a 4-paragraph review with numbered findings. For small/simple PRs: one short summary paragraph, inline comments only where needed. Save deep analysis for PRs that warrant it (large diffs, architectural changes, tricky logic).

**DO:**

- Explore before critiquing
- Provide reasoning for every comment
- Reference existing codebase patterns
- Ask questions when intent is unclear
- Acknowledge trade-offs

**DON'T:**

- Review without understanding context
- Focus on style/syntax over design
- Suggest changes without reasoning
- Give performative praise
- Accept complexity without justification
- Make absolute statements without evidence
- Write long reviews for small changes
