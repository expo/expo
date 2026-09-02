import { MAX_FOLLOWUPS } from '../../../followups/types';
// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0010
//
import { buildBuildWaitFollowUps, type BuildWaitFollowUpInput } from '../followups';

const ID = 'build-1';

function input(overrides: Partial<BuildWaitFollowUpInput> = {}): BuildWaitFollowUpInput {
  return {
    kind: 'build',
    id: ID,
    outcome: 'finished',
    platform: 'IOS',
    buildProfile: 'production',
    buildUrl: null,
    errorDocsUrl: null,
    timeoutMs: 45 * 60_000,
    ...overrides,
  };
}

describe(buildBuildWaitFollowUps, () => {
  it(`points at the build and its artifact when it finished`, () => {
    const followups = buildBuildWaitFollowUps(
      input({ outcome: 'finished', buildUrl: 'https://expo.dev/builds/1' })
    );

    expect(followups.map((followup) => followup.id)).toEqual([
      'open-build-page',
      'eas-build-download',
    ]);
    expect(followups[0]!.command).toBe('https://expo.dev/builds/1');
    expect(followups[1]!.command).toBe(`npx eas build:download --build-id ${ID} --non-interactive`);
  });

  it(`leaves out the build page when the payload named none`, () => {
    expect(
      buildBuildWaitFollowUps(input({ outcome: 'finished' })).map((followup) => followup.id)
    ).toEqual(['eas-build-download']);
  });

  it(`points at the docs EAS linked, then at the build, when it failed`, () => {
    const followups = buildBuildWaitFollowUps(
      input({ outcome: 'errored', errorDocsUrl: 'https://docs.expo.dev/troubleshooting/' })
    );

    expect(followups.map((followup) => followup.id)).toEqual([
      'open-error-docs',
      'eas-build-view',
      'explain-saved-log',
    ]);
    expect(followups[1]!.command).toBe(`npx eas build:view ${ID}`);
  });

  it(`offers the explainer for a failed build, and says it cannot fetch the log itself`, () => {
    // eas-cli has no `build:logs` (llp/0010 §Upstream asks), so the honest rung names the file
    // form and the step in between. A rung reading as though this CLI could download the log
    // would send an agent to `build:explain <id>`, which is the form that does not work yet.
    const followups = buildBuildWaitFollowUps(input({ outcome: 'errored' }));
    const explain = followups.find((followup) => followup.id === 'explain-saved-log');

    expect(explain?.command).toBe('npx @expo/agent-cli build:explain --file <path>');
    expect(explain?.why).toContain('Nothing here can download it for you yet');
  });

  it(`offers no explainer for a submission, whose log is not a native build log`, () => {
    const followups = buildBuildWaitFollowUps(input({ outcome: 'errored', kind: 'submission' }));
    expect(followups.map((followup) => followup.id)).not.toContain('explain-saved-log');
  });

  // A canceled build says nothing about whether it would have worked, so the next rung is the
  // same build again — with the platform and profile this one actually ran with.
  it(`offers the same build again when it was canceled`, () => {
    const followups = buildBuildWaitFollowUps(input({ outcome: 'canceled' }));

    expect(followups.map((followup) => followup.id)).toEqual([
      'eas-build-restart',
      'eas-build-view',
    ]);
    expect(followups[0]!.command).toBe('npx eas build --platform ios --profile production');
  });

  it(`offers the restart without a profile the payload did not name`, () => {
    const followups = buildBuildWaitFollowUps(input({ outcome: 'canceled', buildProfile: null }));

    expect(followups[0]!.command).toBe('npx eas build --platform ios');
  });

  it(`does not offer a restart it cannot spell`, () => {
    const followups = buildBuildWaitFollowUps(input({ outcome: 'canceled', platform: null }));

    expect(followups.map((followup) => followup.id)).toEqual(['eas-build-view']);
  });

  // A timeout is inconclusive, so the first rung waits longer rather than acting on a failure.
  it(`offers a longer wait when the timeout expired`, () => {
    const followups = buildBuildWaitFollowUps(
      input({ outcome: 'timeout', timeoutMs: 45 * 60_000 })
    );

    expect(followups.map((followup) => followup.id)).toEqual(['wait-longer', 'eas-build-view']);
    expect(followups[0]!.command).toBe(`npx @expo/agent-cli build:wait ${ID} --timeout 90m`);
    expect(followups[1]!.command).toBe(`npx eas build:view ${ID} --json`);
  });

  it(`spells the longer wait in the units it lands on`, () => {
    const longer = (timeoutMs: number) =>
      buildBuildWaitFollowUps(input({ outcome: 'timeout', timeoutMs }))[0]!.command;

    expect(longer(30 * 60_000)).toContain('--timeout 1h');
    expect(longer(45_000)).toContain('--timeout 90s');
    expect(longer(75)).toContain('--timeout 150ms');
  });

  describe('a submission', () => {
    it(`polls and views with the submission commands`, () => {
      const followups = buildBuildWaitFollowUps(input({ kind: 'submission', outcome: 'errored' }));

      expect(followups[0]!.command).toBe(`npx eas submit:view ${ID}`);
    });

    // There is no application archive to download and no `eas submit --id` to restart with.
    it(`offers nothing to download, and no restart`, () => {
      expect(
        buildBuildWaitFollowUps(input({ kind: 'submission', outcome: 'finished' })).map(
          (followup) => followup.id
        )
      ).toEqual([]);
      expect(
        buildBuildWaitFollowUps(input({ kind: 'submission', outcome: 'canceled' })).map(
          (followup) => followup.id
        )
      ).toEqual(['eas-build-view']);
    });

    it(`keeps --submission on the longer wait, or it would poll the wrong command`, () => {
      const followups = buildBuildWaitFollowUps(input({ kind: 'submission', outcome: 'timeout' }));

      expect(followups[0]!.command).toContain('--submission');
    });
  });

  it(`never prints more than the follow-up budget`, () => {
    for (const outcome of ['finished', 'errored', 'canceled', 'timeout'] as const) {
      const followups = buildBuildWaitFollowUps(
        input({ outcome, buildUrl: 'https://expo.dev/builds/1', errorDocsUrl: 'https://docs' })
      );
      expect(followups.length).toBeLessThanOrEqual(MAX_FOLLOWUPS);
    }
  });
});
