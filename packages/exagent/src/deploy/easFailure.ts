// @ref llp/0007-deploy-and-headless.rfc.md §Cross-platform deploy
// @ref llp/0021-stop-and-readiness-honesty.rfc.md §Read the tool's own sentence before guessing
// Why `eas deploy` stopped, read out of what it said.
//
// The upload used to be diagnosed from its *exit signature* alone: one `Why:` line, written once,
// naming the most common cause. On an unlinked project that line said "most often an account that is
// not signed in" to somebody who was signed in, while the real cause — `EAS project not configured`,
// and the `eas init` that fixes it — sat in the raw output under a different heading
// [observed — live staging, 2026-08-26, S2; friction run 7, F67].
//
// The EAS CLI's own message is a better source than a guess, and the two strings below are stable
// enough to key on: both were observed live, and both are the *whole* explanation the CLI gives.
// Anything they do not match keeps the guess — and now says out loud that it is one.
//
// Not a needs-human classification. That is `src/needsHuman/` and it is asked separately: this
// answers "what went wrong and what fixes it", which a signed-out machine and an unlinked project
// both have answers to, and only one of them needs a person.

/** What the EAS CLI's own words say, when they say something this CLI can act on. */
export interface EasDeployCause {
  /** The `Why:` line, in this CLI's voice, about what the tool reported. */
  why: string;
  /** The `How:` line. */
  how: string;
  /**
   * The command to put on the `Try:` line, or null when the fix is not one command.
   *
   * Never the command that just failed: a `Try:` that reproduces the failure costs the reader a
   * round trip and teaches them nothing [friction run 7, F67].
   */
  command: string | null;
}

/** One recognisable sentence of the EAS CLI's, and what it means. */
interface EasFailureSignature {
  /** How the CLI says it. Matched against stdout and stderr together. */
  pattern: RegExp;
  cause: EasDeployCause;
}

const SIGNATURES: readonly EasFailureSignature[] = [
  {
    // `EAS project not configured.` — printed with the two `eas init` forms that fix it, on
    // **stdout** [observed — live against an unlinked project, 2026-08-26].
    pattern: /EAS project not configured/i,
    cause: {
      why: 'the EAS CLI reported that this project is not linked to an EAS project, so there is nothing on EAS to deploy to. This is not about being signed in.',
      how: 'link it once with "npx eas init" — that writes the project id into the app config — then run this command again.',
      command: 'npx eas init',
    },
  },
  {
    // `You are not logged in` / `Not logged in` / `Log in with eas login` — the account case, which
    // is what the old single `Why:` line assumed every failure was.
    pattern: /\bnot logged in\b|\beas login\b|\bmust be logged in\b/i,
    cause: {
      why: 'the EAS CLI reported that this machine is not signed in to an Expo account, and the upload ran non-interactively, so it could not ask.',
      how: 'sign in with "npx eas login", or set EXPO_TOKEN to an access token from expo.dev for a machine with nobody at it, then run this command again.',
      command: 'npx eas login',
    },
  },
];

/**
 * What the EAS CLI said went wrong, or null when it said nothing recognisable.
 *
 * Pure over the captured text, so every row is testable without an account.
 *
 * @param output stdout and stderr together — the CLI puts the whole explanation of an unlinked
 * project on stdout and one summary line on stderr, so reading either alone loses one of them.
 */
export function classifyEasDeployFailure(output: string): EasDeployCause | null {
  return SIGNATURES.find((signature) => signature.pattern.test(output))?.cause ?? null;
}
