// @ref llp/0009-smart-followups.rfc.md §Examples per command
// The ladder after a build log has been read. The first rung is whatever the matched rule named,
// because a rule that knows the failure knows the fix better than any general ladder does.

import type { Failure } from '../../builds/explain/types';
import { buildExplainFollowUps } from '../explain';

/** The `--file` this run read, so a re-run rung is a command that actually runs. */
const SOURCE = { kind: 'file', path: '/tmp/build.log' } as const;

function ids(followups: { id: string }[]): string[] {
  return followups.map((followup) => followup.id);
}

function mockFailure(overrides: Partial<Failure> = {}): Failure {
  return {
    phase: 'xcodebuild',
    signature: 'ios.pods.sandbox-out-of-sync',
    line: 231,
    message: 'The installed pods do not match Podfile.lock.',
    matchedLine: 'error: The sandbox is not in sync with the Podfile.lock.',
    context: { before: [], match: 'error: …', after: [] },
    confidence: 'high',
    suggestedCommand: 'npx pod-install --non-interactive',
    docsUrl: 'https://docs.expo.dev/build-reference/troubleshooting/',
    ...overrides,
  };
}

describe(buildExplainFollowUps, () => {
  it('puts the rule’s own fix first', () => {
    const followups = buildExplainFollowUps({
      failure: mockFailure(),
      phase: 'xcodebuild',
      moreMayExist: true,
      source: SOURCE,
    });

    expect(followups[0]).toMatchObject({
      id: 'apply-fix',
      command: 'npx pod-install --non-interactive',
    });
    expect(followups[0]!.why).toContain('ios.pods.sandbox-out-of-sync');
  });

  it('offers the docs page the rule named', () => {
    expect(
      ids(
        buildExplainFollowUps({
          failure: mockFailure(),
          phase: 'xcodebuild',
          moreMayExist: false,
          source: SOURCE,
        })
      )
    ).toEqual(['apply-fix', 'open-docs']);
  });

  it('offers this CLI’s own gate for the phases where it answers the same question', () => {
    const bundle = buildExplainFollowUps({
      failure: mockFailure({
        phase: 'bundle-js',
        signature: 'bundle.syntax-error',
        suggestedCommand: null,
        docsUrl: null,
      }),
      phase: 'bundle-js',
      moreMayExist: false,
      source: SOURCE,
    });
    expect(ids(bundle)).toEqual(['typecheck']);

    const prebuild = buildExplainFollowUps({
      failure: mockFailure({
        phase: 'prebuild',
        signature: 'prebuild.plugin-threw',
        suggestedCommand: null,
        docsUrl: null,
      }),
      phase: 'prebuild',
      moreMayExist: false,
      source: SOURCE,
    });
    expect(ids(prebuild)).toEqual(['config-effective']);
  });

  it('offers no local gate for a native phase, which nothing here reproduces', () => {
    const followups = buildExplainFollowUps({
      failure: mockFailure({ suggestedCommand: null, docsUrl: null }),
      phase: 'gradle',
      moreMayExist: false,
      source: SOURCE,
    });
    expect(followups).toEqual([]);
  });

  it('mentions --all only when there might be more, and only when there is room', () => {
    expect(
      ids(
        buildExplainFollowUps({
          failure: mockFailure({ docsUrl: null }),
          phase: 'gradle',
          moreMayExist: true,
          source: SOURCE,
        })
      )
    ).toEqual(['apply-fix', 'explain-all']);

    // A rule with a fix, a docs page and a phase gate already fills the budget.
    expect(
      ids(
        buildExplainFollowUps({
          failure: mockFailure({ phase: 'bundle-js' }),
          phase: 'bundle-js',
          moreMayExist: true,
          source: SOURCE,
        })
      )
    ).toEqual(['apply-fix', 'open-docs', 'typecheck']);
  });

  it('offers to look wider, and nothing else, when nothing was located', () => {
    // Advice about a diagnosis nobody has is worse than none: the only honest next step is the
    // one that reads more of the log.
    const followups = buildExplainFollowUps({
      failure: null,
      phase: null,
      moreMayExist: true,
      source: SOURCE,
    });
    expect(ids(followups)).toEqual(['explain-all']);
    expect(followups[0]!.why).toContain('No rule matched');
  });

  it('spells the log back into the re-run rung, so it can be pasted', () => {
    // A follow-up is the next thing to *run*: `inspect:build-log --all` with no source would read a
    // terminal's stdin and fail with BAD_ARGS.
    const fromFile = buildExplainFollowUps({
      failure: mockFailure({ docsUrl: null }),
      phase: 'gradle',
      moreMayExist: true,
      source: { kind: 'file', path: '/tmp/build.log' },
    });
    expect(fromFile.find((followup) => followup.id === 'explain-all')?.command).toBe(
      'npx @expo/agent-cli inspect:build-log --file /tmp/build.log --all'
    );

    // A piped log cannot be re-read — the bytes are gone — so the rung spells the pipe back out
    // rather than naming a file that does not exist.
    const fromStdin = buildExplainFollowUps({
      failure: null,
      phase: null,
      moreMayExist: true,
      source: { kind: 'stdin' },
    });
    expect(fromStdin[0]!.command).toBe(
      'npx @expo/agent-cli inspect:build-log --stdin --all --context 40'
    );
  });

  it('never offers more than the budget', () => {
    const followups = buildExplainFollowUps({
      failure: mockFailure({ phase: 'bundle-js' }),
      phase: 'bundle-js',
      moreMayExist: true,
      source: SOURCE,
    });
    expect(followups.length).toBeLessThanOrEqual(3);
  });
});
