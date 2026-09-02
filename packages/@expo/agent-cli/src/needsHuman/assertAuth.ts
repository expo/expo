// @ref llp/0010-agent-conventions.rfc.md §Needs-human protocol — layer 1, raised.
// `preflight.ts` answers "who is this machine signed in as" and never throws, because `status`
// only wants to *report* it. A command that cannot do its job without an account wants the other
// half: stop now, and hand the login to a person.
//
// Its own module rather than a function in `preflight.ts`, so that the promise of that file — this
// asks and never fails — keeps holding.

import { needsHumanError } from './error';
import { readAuthPreflightAsync, type AuthPreflight } from './preflight';

export interface AssertSignedInOptions {
  /** What this command was about to do, e.g. `deploy this project`. */
  action: string;
  /** What the account is needed *for*, one clause, e.g. `EAS Hosting uploads as an account`. */
  because: string;
}

/**
 * Stop before an expensive step when nothing is signed in.
 *
 * The answer that matters is the *third* one. `false` is a stop; `true` runs; and `null` — nothing
 * could be asked, because there is no EAS CLI here, because it timed out, or because the binary
 * under that name is not the CLI — **also runs**. A preflight that could not run has learned
 * nothing about the account, and treating "no answer" as "signed out" would stop a command that
 * had every right to work and hand its user a login they may already have. The real failure, if
 * there is one, is still recognised where it happens (layer 3).
 *
 * @returns what the preflight answered, for a caller that wants to report it.
 * @throws {NeedsHumanError} `EAS_LOGIN_REQUIRED` when the CLI said nobody is signed in.
 */
export async function assertSignedInAsync(
  projectRoot: string,
  { action, because }: AssertSignedInOptions
): Promise<AuthPreflight> {
  const auth = await readAuthPreflightAsync(projectRoot);
  if (auth.loggedIn !== false) {
    return auth;
  }

  throw needsHumanError('eas-login', {
    detectedBy: 'preflight',
    message: [
      `No Expo account is signed in on this machine, so ${action} would fail.`,
      `Why: ${because}, and "eas whoami" answered that nobody is signed in — asked before anything ran, so nothing was spent finding out.`,
      `How: sign in with "npx eas login", or, on a machine with nobody at the keyboard, set EXPO_TOKEN to an access token from expo.dev.`,
    ].join('\n'),
  });
}
