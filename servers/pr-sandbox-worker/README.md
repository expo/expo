# PR Sandbox Worker

This template provides the untrusted-code execution service for external PR review evidence.
Codex and GitHub write credentials stay on the trusted controller; this Worker only receives public
repo metadata, a PR number, and an exact head SHA.

## Deploy

```sh
pnpm install
pnpm wrangler secret put PR_SANDBOX_AUTH_TOKEN
pnpm deploy
```

Set `PR_SANDBOX_WORKER_URL` and `PR_SANDBOX_AUTH_TOKEN` in the trusted controller environment.

## Controller Usage

Create a job pinned to a PR head SHA:

```sh
et pr-sandbox create_pr_job \
  --worker-url "$PR_SANDBOX_WORKER_URL" \
  --auth-token "$PR_SANDBOX_AUTH_TOKEN" \
  --pr-url https://github.com/owner/repo/pull/123
```

Run a preset:

```sh
et pr-sandbox run_preset --job-id pr-owner-repo-123-abcdef123456 --preset checkout
```

Long-running presets are launched as sandbox tasks. The CLI polls the task status endpoint until the
task finishes, so checkout/install/test actions are not limited by one long HTTP request.

Run iterative follow-up commands in the same sandbox job:

```sh
et pr-sandbox run_command \
  --job-id pr-owner-repo-123-abcdef123456 \
  --command "pnpm lint"

et pr-sandbox run_command \
  --job-id pr-owner-repo-123-abcdef123456 \
  --command "node -e \"console.log(require('./package.json').scripts)\""
```

`get_logs` shows a running task marker as soon as a long command starts and appends stdout, stderr,
and exit code after completion.

Collect one evidence JSON file and destroy the job afterwards:

```sh
et pr-sandbox collect_evidence \
  --pr-url https://github.com/owner/repo/pull/123 \
  --output /tmp/pr-123-sandbox-evidence.json \
  --destroy-job
```

## Security Boundary

- Worker outbound traffic uses `enableInternet = false` and an explicit `allowedHosts` list.
- The sandbox never receives `CODEX_API_KEY`, `OPENAI_API_KEY`, GitHub write tokens, Cloudflare API
  tokens, registry credentials, or deployment secrets.
- Package scripts, build output, logs, PR file contents, commit messages, and branch names are
  untrusted PR-controlled data.
- GitHub posting remains handled by the existing `deep-code-review` skill preview/post gates.

## Presets

- `checkout`: clones the public GitHub repo and checks out the exact head SHA.
- `node_install`: lockfile-based npm, pnpm, Yarn, or Bun install.
- `node_test`, `node_lint`, `node_typecheck`: runs matching package scripts when present.
- `gradle_check`: runs `./gradlew test` when a Gradle wrapper exists.
- `swift_check`: runs `swift test` for Swift packages when this image has `swift` installed.
- `cpp_check`: runs CMake configure/build when `CMakeLists.txt` exists.
