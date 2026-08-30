// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0005
//
// The `--help` block `@expo/agent-cli runtime:network` had, lifted out of `src/runtime/index.ts` when the
// command left the v1 surface. The `runtime` group shares one help block across its actions, so
// these lines were spliced into three places in it: the action's own option list, the examples, and
// the caveat paragraph. Restoring the command means putting each back where the marker says.

import chalk from 'chalk';

import { PROGRAM_PREFIX } from '../../programName';
import { DURATION_METAVAR } from '../../utils/args';

/** The action's entry in the `Options` block, printed under `runtime:errors`. */
export const NETWORK_OPTION_LINES = [
  chalk`{bold runtime:network}            Collect the app's HTTP requests over a time window`,
  `  --duration ${DURATION_METAVAR}   How long to listen for requests (default: 5s)`,
  `  --no-followups          Skip the "Suggested next:" section of suggested follow-up commands`,
  '',
];

/** The action's line in the `Examples` block, printed after the `runtime:errors` example. */
export const NETWORK_EXAMPLE_LINE = chalk`  {dim $} ${PROGRAM_PREFIX} runtime:network --duration 10s --json`;

/**
 * The paragraph that told a reader why an empty report is not an answer.
 *
 * The reason the command was deferred, written out before it was: the domain is unstable, so the
 * command's most common outcome on Expo Go was an explanation rather than a request log.
 */
export const NETWORK_CAVEAT_LINES = [
  chalk`  {bold runtime:network} reads the debugger's Network domain, which React Native still ships`,
  chalk`  behind an unstable flag, and which attaches only while the app registers exactly one`,
  chalk`  React Native host. When the app does not report requests, the command quotes the runtime's`,
  chalk`  own answer instead of printing an empty list — use {bold runtime:errors} in that case.`,
  '',
];
