# PR Sandbox Evidence Controller

`et pr-sandbox` is the trusted controller-side CLI adapter for collecting execution evidence from
public PRs. It talks to the Cloudflare Worker template in `tools/templates/pr-sandbox-worker` and
does not send Codex/OpenAI/GitHub write credentials into the sandbox.

## Actions

- `create_pr_job`: create a sandbox job pinned to a repo, PR number, and exact head SHA.
- `run_preset`: run one allowlisted preset in that job.
- `get_logs`: return capped/redacted sandbox logs.
- `read_file`: read a relative path from the checked-out repo.
- `destroy_job`: destroy the sandbox job.
- `collect_evidence`: run the V1 evidence flow and emit JSON with a `context` field for
  `deep-code-review`.

## Deep Code Review Handoff

For a public external PR:

```sh
et pr-sandbox collect_evidence \
  --pr-url https://github.com/owner/repo/pull/123 \
  --worker-url "$PR_SANDBOX_WORKER_URL" \
  --auth-token "$PR_SANDBOX_AUTH_TOKEN" \
  --output /tmp/pr-123-sandbox-evidence.json \
  --destroy-job
```

Feed the generated `context` plus the regular PR metadata/diff into `/deep-code-review <PR_URL>`.
The existing `deep-code-review` skill remains responsible for writing
`code-review-{pull_number}.json` and for its preview/post-pending/submit gates.

## Verification

Local verification covers controller validation, preset selection, command allowlisting, context
generation, log redaction/truncation, expotools build, and the full expotools test suite. Live Worker
acceptance still requires a deployed Cloudflare Sandbox Worker because Durable Object/container
lifecycle cannot be exercised inside the expotools unit test runner.
