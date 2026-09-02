// @ref llp/0008-guardrails.rfc.md §Consent is a re-run, never a prompt
//
// The one thing this helper must never do is hand back a command that is not the command the
// caller typed. A re-run that lost `--ios` starts a different build (F58/F103), and a re-run the
// caller has to edit before it works is not a hint, it is homework.

import { consentRerunCommand } from '../consent';

/** A `process.argv` as node builds it: the binary, the script, then what was typed. */
function argv(...typed: string[]): string[] {
  return ['/usr/bin/node', '/tmp/cli/bin/cli.js', ...typed];
}

describe(consentRerunCommand, () => {
  it('carries the whole invocation, verbatim, and appends the flag', () => {
    expect(consentRerunCommand(['dev'], argv('dev', '--ios', '--port', '8082'))).toBe(
      'npx @expo/agent-cli dev --ios --port 8082 --yes'
    );
  });

  it('names the program the way a caller can copy', () => {
    expect(consentRerunCommand(['dev'], argv('dev'))).toBe('npx @expo/agent-cli dev --yes');
  });

  it('keeps the flags after a `--` separator, which belong to another tool', () => {
    expect(consentRerunCommand(['dev'], argv('dev', '--', '--verbose'))).toBe(
      'npx @expo/agent-cli dev -- --verbose --yes'
    );
  });

  it('quotes an argument a shell would split, so the line can be pasted', () => {
    expect(consentRerunCommand(['new'], argv('new', 'My App'))).toBe(
      `npx @expo/agent-cli new 'My App' --yes`
    );
  });

  it('adds no second flag when the caller already typed one', () => {
    // Unreachable from the guardrails themselves, which only ask when the flag is absent. It is
    // pinned because a duplicated flag would be the first sign that some later caller asks anyway.
    expect(consentRerunCommand(['dev'], argv('dev', '--yes'))).toBe(
      'npx @expo/agent-cli dev --yes'
    );
    expect(consentRerunCommand(['doctor:fix'], argv('doctor:fix', '-y'))).toBe(
      'npx @expo/agent-cli doctor:fix -y'
    );
  });

  it('falls back to the command name when this process was started without argv', () => {
    // An embedder that required the bundle rather than spawning the bin. The caller's own name for
    // the command is the best answer left, and it is still a command that works.
    expect(consentRerunCommand(['dev', '--ios'], ['/usr/bin/node'])).toBe(
      'npx @expo/agent-cli dev --ios --yes'
    );
  });
});
