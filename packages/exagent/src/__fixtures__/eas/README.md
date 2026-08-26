# Recorded EAS answers

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

Two shapes worth noticing, because both would be easy to get wrong from the docs alone:

- `status` and `platform` are the **raw GraphQL enums** (`IN_PROGRESS`, `STOPPED`, `IOS`) while
  `type` is the lower-case **flag spelling** (`agent-device`). A comparison that lower-cases all
  three, or none, is wrong either way.
- `finishedAt` and `startedAt` are **absent** rather than null when they do not apply, and
  `pageInfo` gains `startCursor`/`endCursor` only when the page is non-empty.

`agent-device` answers are not recorded as files — they are single lines, quoted in the tests and in
llp/0005 where the behaviour they show is argued.
