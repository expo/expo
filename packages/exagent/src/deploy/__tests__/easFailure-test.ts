// @ref llp/0021-stop-and-readiness-honesty.rfc.md §Read the tool's own sentence before guessing
// Live staging's S2 and friction run 7's F67: the upload was diagnosed from its exit signature, so
// an unlinked project was told it was not signed in while the real cause sat in the raw output.

import { classifyEasDeployFailure } from '../easFailure';

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

    expect(cause?.command).toBe('npx eas init');
    expect(cause?.why).toContain('not linked');
    // The sentence has to rule the wrong answer out, because that is the answer it replaces.
    expect(cause?.why).toContain('not about being signed in');
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
