# Recorded `eas-cli` payloads

What the published EAS CLI actually prints, recorded from a signed-in machine against a real
account. Every file here is provenance for a parser: the shapes in `src/builds/`, `src/impact/` and
`src/needsHuman/` are read across a process boundary this package does not control, and a fixture
recorded from the service is the only thing that turns an `[inferred]` shape into an `[observed]`
one.

**Provenance.** All recorded 2026-08-26, `eas-cli/22.4.0 darwin-arm64 node-v26.5.0`, signed in as
`alice`, against `@expo/observability` (`apps/observe-tester`, project
`5310c5f2-8ab4-4d5e-8f53-a5c90aa9594a`). Every command was read-only; nothing was built, submitted
or created.

**Trimming.** Only two edits were made, both marked where they happen:

- Google Cloud Storage signed URLs keep their path and lose their query string
  (`?<signed-query-trimmed>`). The signature is a 15-minute credential, so keeping it would commit
  an expired secret and a kilobyte of noise for no gain — the *shape* is the path.
- `gitCommitMessage` keeps its first line, and `fingerprint*.sources` keep their first three
  entries. Both are unbounded in the real payload (the recorded compare was 1.1 MB) and neither
  parser reads more than the shape of one entry.

Nothing else is altered: keys, casing, ordering and null-ness are as the CLI printed them.

| File | Command | What it pins |
| --- | --- | --- |
| `build-view.json` | `eas build:view <id> --json` | `status` is `SCREAMING_SNAKE` (`FINISHED`), `platform` is `IOS`/`ANDROID`. See `src/builds/status.ts`. |
| `build-list.json` | `eas build:list --platform ios --fingerprint-hash <hash> --status finished --limit 1 --json --non-interactive` | The build-cache lookup's exact argv, and that `id`/`status`/`platform`/`buildProfile`/`createdAt`/`artifacts.buildUrl` all exist. See `src/impact/buildCache.ts`. |
| `build-list-unconfigured.json` | the same command, in a project with no EAS link | The whole outcome (`exitCode`, `stdout`, `stderr`): the CLI exits **1** and puts its whole explanation on **stdout**, leaving only `Error: build:list command failed.` on stderr. That is why `describeLookupFailure` reads stdout first. Recorded against the unlinked `notesapp`. |
| `fingerprint-compare.json` | `eas fingerprint:compare --build-id <id> --json --non-interactive` | `{ fingerprint1, fingerprint2 }`, each `{ hash, sources }` — **two whole fingerprints, not a diff**. `fingerprint1` is the build, `fingerprint2` is the working tree. See `src/impact/compare.ts`. |
| `whoami.txt` | `eas whoami` | The account name is the **first** line; the email, and an `Accounts:` list when the actor belongs to more than their personal account, follow it. See `src/needsHuman/preflight.ts`. |
| `simulator-availability.json` | `eas simulator:availability --json --non-interactive` | `{ available, accountName }`. The one `simulator:*` payload that can be recorded without starting a session. See `src/device/cloudSimulator.ts`. |

## The non-terminal statuses, recorded on staging

`IN_QUEUE` and `IN_PROGRESS` are only observable while a build is running, which used to make them
unrecordable: starting a build is a mutating, billable call. **Staging is neither**, so they are
recorded now [the staging builds were authorized, 2026-08-26].

Captured with `EXPO_STAGING=1`, `eas-cli/22.5.0`, signed in as `alice`, against
`@bob/SampleApp` (project `861a6e66-a6c4-4314-abbf-b52f0bf80cef`) — a different account and
project from the prod recordings above, because the staging service has its own accounts. Same
trimming rules.

| File | Command | What it pins |
| --- | --- | --- |
| `build-view-in-queue.staging.json` | `eas build:view <id> --json` on a queued iOS simulator build | `IN_QUEUE` is the spelling, `logFiles` is `[]` and `artifacts` is `{}` before the build starts |
| `build-view-in-progress.staging.json` | the same, on a running Android build | `IN_PROGRESS` is the spelling, and `logFiles` is **populated while the build is still running** — a log is fetchable before there is a result |

Two facts these settle, both of which `src/builds/parseView.ts` rests on:

- **`queuePosition` and `estimatedWaitTimeLeftSeconds` are absent from both.** Not null — absent.
  They are requested on every query (`graphql/types/Build.js` lists them beside `isForIosSimulator`,
  which does arrive), and they did not appear on a single one of 47 polls across a ~10-minute
  `IN_QUEUE` and the `IN_PROGRESS` that followed, on either platform.
- **No `--json` output of this CLI ever contains a `null`.** `printJsonOnlyOutput` sanitizes every
  payload first, and the sanitizer **drops each key whose value is null** along with `__typename`
  [observed — `utils/json.js`: `if (key !== '__typename' && value[key] !== null)`]. So absence is
  the only way the wire can say "null", and a parser must not try to tell the two apart. This
  applies to every `eas --json` payload in this directory, not only these two.

`NEW` and `PENDING_CANCEL` are still unrecorded: `NEW` is held for a shorter window than one poll
caught, and `PENDING_CANCEL` needs a cancellation to land mid-flight. `CANCELED` / `CANCELLED` stay
`[inferred]`; `src/builds/status.ts` accepts both spellings and treats an unrecognized status as
non-terminal, so none of the three can hang a wait.

## What could not be recorded, and why
- **Every other `simulator:*` payload.** `simulator:get`, `simulator:exec` and `simulator:stop` all
  need a live session, and starting one is a mutating, billable call. Their *argv* is confirmed
  against `--help` on 22.4.0 (llp/0005 §Cloud simulator); their JSON stays `[inferred]`.
- **`eas whoami` under `EXPO_TOKEN`.** The first line becomes
  `<name> (authenticated using EXPO_TOKEN)` [observed — `eas-cli/build/commands/account/view.js`,
  22.4.0], but recording it needs a token this machine does not have. The parser handles the suffix
  from the source rather than from a payload.

## The EAS Simulator session recordings

Real payloads, captured verbatim from a signed-in machine against `api.expo.dev`, so the parsers in
`src/device/cloudSimulator.ts` are pinned against **what the service said** rather than against what
this package assumed it would say.

Captured 2026-08-26 with `eas-cli/22.4.0`, from the `expo-ci` account and the
`expo-workflow-testing` project, during one bounded EAS Simulator session
(`01a03d80-0556-7d22-98df-f415d9392b98`, created 09:56:35Z, stopped 09:58:58Z). Nothing here carries
a credential: the daemon URL and token live in `.env.eas-simulator` and are deliberately not
recorded.

| File | Command |
| --- | --- |
| `simulator-list-empty.json` | `eas simulator:list --status in-progress --limit 25 --json`, with nothing running |
| `simulator-list-in-progress.json` | the same command while the session was up |
| `simulator-list-stopped.json` | `eas simulator:list --limit 5 --json` after `simulator:stop` |

### The Android half, recorded on staging

Every session recording above is **iOS**. `simulator-list-android-in-progress.staging.json` is the
other half [observed — 2026-08-26, `EXPO_STAGING=1`, `eas-cli/22.5.0`, account `bob`, project
`SampleApp`], captured from a session that had a **real development build installed on it** —
`eas simulator --platform android --build-id <id> --type agent-device`, where the build is the APK
of the app under test rather than Expo Go. The session was stopped when the run finished
(`{"id": …, "status": "STOPPED"}`).

It carries no credential: the daemon URL and token come back from `eas simulator --json` on stdout
and are deliberately not recorded here, the same rule the iOS recordings follow.

What it settles is that the shapes below are not iOS-specific — `platform` is the raw enum
`ANDROID`, `status` is `IN_PROGRESS`, `type` is the flag spelling `agent-device`, `finishedAt` is
absent rather than null, and `pageInfo` carries both cursors on a non-empty page.

Two shapes worth noticing, because both would be easy to get wrong from the docs alone:

- `status` and `platform` are the **raw GraphQL enums** (`IN_PROGRESS`, `STOPPED`, `IOS`) while
  `type` is the lower-case **flag spelling** (`agent-device`). A comparison that lower-cases all
  three, or none, is wrong either way.
- `finishedAt` and `startedAt` are **absent** rather than null when they do not apply, and
  `pageInfo` gains `startCursor`/`endCursor` only when the page is non-empty.

`agent-device` answers are not recorded as files — they are single lines, quoted in the tests and in
llp/0005 where the behaviour they show is argued.
