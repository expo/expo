// @ref llp/0021-honest-reports.rfc.md §The rules
// Live staging's S2 and friction run 7's F67: the upload was diagnosed from its exit signature, so
// an unlinked project was told it was not signed in while the real cause sat in the raw output.

import { classifyEasDeployFailure } from '../easFailure';

/** The whole of what an unlinked project's `eas deploy` prints [observed — friction run 9]. */
const UNLINKED_OUTPUT = [
  'EAS project not configured. This command cannot configure it in non-interactive mode. Run one of the following, then re-run this command:',
  '',
  'To link an existing project:',
  '',
  '  eas init --id <project-id> --non-interactive',
  '',
  'To create a new project:',
  '',
  '  eas init --account <account-name> --non-interactive',
  '',
  'Accounts you can create projects in: alice, expo, expo-services, bob',
  '    Error: deploy command failed.',
].join('\n');

describe(classifyEasDeployFailure, () => {
  // The whole finding: this output is what an unlinked project produces, and "not signed in" is
  // what the old single `Why:` line said about it.
  it(`should read an unlinked project, and name eas init`, () => {
    const cause = classifyEasDeployFailure(
      [
        'EAS project not configured.',
        'Run "eas init" to configure this project, or "eas init --id <id>" to link an existing one.',
        'Error: deploy command failed.',
      ].join('\n')
    );

    expect(cause?.command).toContain('npx eas init');
    expect(cause?.why).toContain('not linked');
    // The sentence has to rule the wrong answer out, because that is the answer it replaces.
    expect(cause?.why).toContain('not about being signed in');
  });

  // @ref llp/0007-deploy-and-headless.rfc.md §deploy — **F143.** `npx eas init` on
  // its own is a command that prompts, and this failure exists because the run had no terminal to
  // prompt in: handing it back is handing back the same dead end one command earlier. The runnable
  // form needs a value, and the EAS CLI's own output is where that value is.
  it(`should name the non-interactive form of the fix`, () => {
    const cause = classifyEasDeployFailure(UNLINKED_OUTPUT);

    expect(cause?.command).toBe('npx eas init --account <account-name> --non-interactive');
    // Both forms in the How:, because linking an existing project and creating a new one are
    // different intentions and only the caller knows which one they have.
    expect(cause?.how).toContain('--id <project-id> --non-interactive');
    expect(cause?.how).toContain('--account');
  });

  // The accounts are the one value this CLI cannot invent, and the tool printed them.
  it(`should quote the accounts the EAS CLI listed`, () => {
    expect(classifyEasDeployFailure(UNLINKED_OUTPUT)?.how).toContain(
      'alice, expo, expo-services, bob'
    );
  });

  // With one account there is no choice to make, so the line has no hole in it and an agent can run
  // it — which is the difference between a handoff and a next action.
  it(`should fill the account in when the EAS CLI named exactly one`, () => {
    const cause = classifyEasDeployFailure(
      ['EAS project not configured.', 'Accounts you can create projects in: bob'].join('\n')
    );

    expect(cause?.command).toBe('npx eas init --account bob --non-interactive');
  });

  it.each([
    ['You are not logged in. Run "eas login".'],
    ['Error: Not logged in'],
    ['An Expo user account is required. Must be logged in.'],
  ])(`should read a signed-out machine from %p`, (output) => {
    expect(classifyEasDeployFailure(output)?.command).toBe('npx eas login');
  });

  // Nothing recognised is not a licence to guess: the caller says so instead.
  it(`should answer null for output it does not recognise`, () => {
    expect(classifyEasDeployFailure('Error: deploy command failed.')).toBeNull();
  });

  it(`should answer null for empty output`, () => {
    expect(classifyEasDeployFailure('')).toBeNull();
  });
});
