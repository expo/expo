/* eslint-env jest */
// @ref llp/0022-live-tier.plan.md §live-eas: the read side, and exactly one write
//
// The EAS half of the live tier, against **staging** and nothing else. Every invocation goes through
// `runLiveEasAsync`, which asserts `EXPO_STAGING=1` at the call site rather than trusting the gate at
// the top of the file — see `prereq.ts` §assertStaging for why that is not belt-and-braces.
//
// @ref llp/0019-backend-parity-audit.plan.md §What is still not tested — "no live `eas build`,
// `eas deploy` or simulator session runs anywhere in this suite" was the open row, and its four EAS
// bugs were all in code with a passing unit test one call frame away. This is the row.
//
// The budget this suite spends, and the shape it takes from that:
//
//  - **Reads are free and repeated.** `whoami`, `status --explain`, `inspect:build-log`.
//  - **One write per run, and it is idempotent.** `deploy --web` of the `livecheck` fixture. EAS
//    Hosting gives each deploy its own preview URL, so re-running adds a deployment and changes
//    nothing that existed — which is what makes it safe to run on every green build.
//  - **No native build.** No v1 command creates one [observed — staging-live, 2026-08-26], so there
//    is nothing here to test and nothing this suite could spend an EAS build worker on.
//
// The read side reads a **copy** of an EAS-linked project, never the original: the copy gets a
// `node_modules`, a `.expo` directory and whatever else the CLI writes, and the original is
// somebody's working tree.

import fs from 'node:fs';
import path from 'node:path';

import {
  allOf,
  builtBinGate,
  describeLive,
  easProjectGate,
  networkGate,
  packageRunnerGate,
  stagingGate,
} from '../prereq';
import {
  LiveRun,
  copyTreeAsync,
  downloadBuildLogAsync,
  execAsync,
  expectExit,
  fixturesDir,
  httpBodyAsync,
  httpStatusAsync,
  installDependenciesAsync,
  parseJson,
  runLiveEasAsync,
} from '../utils';

const staging = stagingGate();
const easProject = easProjectGate();
const gate = allOf(
  builtBinGate(),
  staging.gate,
  packageRunnerGate(),
  networkGate(),
  easProject.gate
);

describeLive('live-eas', gate)('live-eas: the real service, on staging', () => {
  const run = new LiveRun('live-eas');
  let readProjectRoot = '';
  let deployProjectRoot = '';

  beforeAll(async () => {
    run.prepare();
    // The read-side project: a copy of an EAS-linked project with finished builds on staging. APFS
    // clones make this instant on macOS; elsewhere it is a real copy, which is why the gate points
    // at a project rather than requiring one particular path.
    readProjectRoot = path.join(run.tempDir, 'eas-read');
    await copyTreeAsync(easProject.source as string, readProjectRoot);
    await installDependenciesAsync(run, readProjectRoot);

    // The write-side project: the tiny fixture, installed fresh. Its `app.json` names the staging
    // project it deploys to, so nothing here has to be discovered or linked at runtime.
    deployProjectRoot = path.join(run.tempDir, 'livecheck');
    await copyTreeAsync(path.join(fixturesDir, 'livecheck'), deployProjectRoot);
    await installDependenciesAsync(run, deployProjectRoot);

    run.onCleanup('scratch projects', () => {
      if (!process.env.EXAGENT_LIVE_KEEP) {
        fs.rmSync(run.tempDir, { recursive: true, force: true });
      }
    });
  });

  afterAll(async () => {
    await run.cleanUpAsync();
    console.log(run.costLine());
  });

  it('the original project on disk is not the one being written to', () => {
    // The read-only half of "read-only", asserted rather than intended. Everything after this point
    // runs in `run.tempDir`; if that ever stops being true, this is where it is caught.
    expect(readProjectRoot.startsWith(run.tempDir)).toBe(true);
    expect(deployProjectRoot.startsWith(run.tempDir)).toBe(true);
    expect(path.resolve(easProject.source as string).startsWith(run.tempDir)).toBe(false);
  });

  // --- identity -----------------------------------------------------------------------------------

  it('whoami answers from the staging session, and names the file it read', async () => {
    const result = await runLiveEasAsync(run, readProjectRoot, ['whoami', '--json'], {
      label: 'whoami',
    });
    expectExit(result, 0);
    const report = parseJson(result);
    expect(report.loggedIn).toBe(true);
    expect(report.user).toBe(staging.user);
    // S6: the preamble used to hardcode `~/.expo/state.json`, which is the wrong file under
    // EXPO_STAGING. The session file it reports has to be the one it actually read.
    expect(report.sessionFile).toContain('.expo-staging');
  });

  it('status reports the same identity its own whoami does', async () => {
    const result = await runLiveEasAsync(run, readProjectRoot, ['status', '--json'], {
      label: 'status-auth',
    });
    expectExit(result, 0);
    const report = parseJson(result);
    // F65: `status` said "auth unknown (nothing could answer)" on a machine whose session was on
    // disk and whose own `whoami` read it. Two commands, one answer.
    expect(report.auth.loggedIn).toBe(true);
    expect(report.auth.user).toBe(staging.user);
  });

  // --- the build read side ------------------------------------------------------------------------

  it('status --explain asks EAS, and every row it comes back with keeps its contract', async () => {
    const result = await runLiveEasAsync(run, readProjectRoot, ['status', '--explain', '--json'], {
      label: 'status-explain',
    });
    // Never fails a command: every way of not getting an answer is an `unknown` with a reason, and
    // the section costs one line of the report rather than the exit code.
    expectExit(result, 0);
    const report = parseJson(result);
    expect(report.builds.askedEas).toBe(true);
    expect(report.builds.platforms.map((p: any) => p.platform).sort()).toEqual(['android', 'ios']);

    for (const platform of report.builds.platforms) {
      // Whatever the service said, the hash asked about is a real per-platform fingerprint hash from
      // the real @expo/fingerprint the project resolved — which is what llp/0002's published-binary
      // rule is about, and the one thing here that no stub can be wrong about.
      expect(platform.fingerprintHash).toMatch(/^[0-9a-f]{40}$/);
      expect(['found', 'none', 'unknown']).toContain(platform.state);
      if (platform.state === 'found') {
        expect(platform.buildId).toMatch(/^[0-9a-f-]{36}$/);
        expect(typeof platform.buildProfile).toBe('string');
        expect(platform.source).toBe('eas');
      }
    }
    // Every platform reaches an answer, which until wave 22 held on about half the runs — see F93
    // below for what was in the way.
    expect(report.builds.platforms.every((p: any) => p.state !== 'unknown')).toBe(true);
  });

  it('the lookup does find the real build this project was made from', async () => {
    // The claim the row in llp/0019 was missing. One run and no retry: the retry that used to be here
    // was scaffolding for F93, and it went with the fix.
    const result = await runLiveEasAsync(run, readProjectRoot, ['status', '--explain', '--json'], {
      label: 'status-explain-found',
    });
    expectExit(result, 0);
    const found = parseJson(result).builds.platforms.find((p: any) => p.state === 'found') ?? null;

    expect(found).not.toBeNull();
    expect(found.buildId).toMatch(/^[0-9a-f-]{36}$/);
    expect(found.buildUrl).toMatch(/^https:\/\//);
    // The build the service returned was made from the hash that was asked about, which is the
    // exactness the whole lookup design rests on ([[0011-impact-and-freshness]] §The build-cache
    // lookup) and which a stub cannot put at risk.
    expect(found.fingerprintHash).toMatch(/^[0-9a-f]{40}$/);
  });

  // F93 — MAJOR, found by this suite on 2026-08-27, **fixed in wave 22**.
  //
  // What it was: `status --explain` runs its two per-platform lookups concurrently (`Promise.all` in
  // `src/status/easBuilds.ts` §readEasBuildsStatusAsync). In a project that does not pin `eas-cli` —
  // the common case, and the case wave 18 made the only rung — each lookup spawns
  // `bunx eas-cli@latest`, and both shared one per-spec scratch directory
  // (`$TMPDIR/bunx-501-eas-cli@latest`). Started milliseconds apart they collided: the loser exited 1
  // with empty stdout, and `describeLookupFailure` (src/impact/buildCache.ts) then reported the first
  // line of its stderr — **bun's own progress output** — as what the service said about the caller's
  // builds.
  //
  // Observed, six runs against a fresh copy of the same project with no `.expo` cache:
  //   both platforms poisoned 2/6, one platform poisoned 1/6, clean 3/6.
  //   reason: "Resolving dependencies"   ← bun installing, not EAS answering
  // The identical argv run on its own exited 0 with the correct payload every time, and inserting a
  // ~50 ms skew between the two spawns made the collision disappear.
  //
  // llp/0019 bug 3, one process boundary further out: there a wrapper's panic was reported as EAS's
  // answer; here the package runner's progress line was. The difference is that the runner is this
  // CLI's own choice rather than the machine's, so the reason was not even untrusted output from
  // somebody else's binary — it was noise from a tool this CLI decided to use.
  //
  // The fix is a per-spec mutex in the spawn layer (`src/utils/runnerLock.ts`) plus a guard that will
  // not let a runner's line be quoted as the service's answer even when the two do collide
  // (`looksLikeRunnerNoise`). This test asserts both halves against the real runner.
  it("F93: a build lookup never reports the package runner's progress line as EAS's answer", async () => {
    // **The cache has to go first**, and this is the whole reason the test says so out loud: by the
    // time this runs, the tests above have written `.expo/exagent-eas-builds.json`, and a cache hit
    // costs one `readFileSync` — so iOS answers without a spawn and the concurrent pair the defect
    // needs never exists [observed — 2026-08-27: `source: "cache"` for ios, `"eas"` for android, so
    // this test was asserting one lookup]. Deleting it puts both platforms back on the network path,
    // started milliseconds apart, which is the state F93 was found in.
    fs.rmSync(path.join(readProjectRoot, '.expo', 'exagent-eas-builds.json'), { force: true });

    const result = await runLiveEasAsync(run, readProjectRoot, ['status', '--explain', '--json'], {
      label: 'f93-status-explain',
    });
    expectExit(result, 0);
    const report = parseJson(result);
    for (const platform of report.builds.platforms) {
      // The guard: whatever went wrong, the runner's vocabulary is never the reason on its own.
      expect(platform.reason ?? '').not.toMatch(
        /^(Resolving dependencies|Saved lockfile|Resolved, downloaded and extracted)/
      );
      // Asked, and answered by the service rather than out of the record this test just removed.
      expect(platform.source).toBe('eas');
    }
    // And the stronger half, which is the mutex: with both platforms asked at once, both get an
    // answer. This is the assertion that was a coin toss before the fix.
    expect(report.builds.platforms.every((p: any) => p.state !== 'unknown')).toBe(true);
  });

  it('status --explain --build against a build that does not exist says so, in text and in JSON', async () => {
    const result = await runLiveEasAsync(
      run,
      readProjectRoot,
      ['status', '--explain', '--build', 'not-a-real-build-id', '--json'],
      { label: 'status-explain-build' }
    );
    expectExit(result, 0);
    const report = parseJson(result);
    // F66: the flag's target has to be echoed somewhere. A caller who passed `--build` and got an
    // ordinary report back believed the comparison happened.
    const serialized = JSON.stringify(report);
    expect(serialized).toContain('not-a-real-build-id');
  });

  // --- a real EAS build log -----------------------------------------------------------------------

  describe('inspect:build-log on a log EAS actually served', () => {
    let rawPath = '';
    let decodedPath = '';

    beforeAll(async () => {
      // The log URL comes from the service, through the same package runner this CLI uses, because
      // an EAS build's log URL is signed and expires — a committed URL would be a test that rots.
      const listed = await execAsync(
        'npx',
        ['--yes', 'eas-cli@latest', 'build:list', '--limit', '20', '--json', '--non-interactive'],
        {
          cwd: readProjectRoot,
          env: { EXPO_STAGING: '1' },
          timeoutMs: 300_000,
        }
      );
      run.writeArtifact('build-list.json', listed.stdout);
      const builds = JSON.parse(listed.stdout);
      // An ERRORED build is the stable input: it has a failure to locate, and unlike a FINISHED one
      // its log is guaranteed to contain something for the rules to match.
      const errored = builds.find(
        (build: any) => build.status === 'ERRORED' && build.logFiles?.length
      );
      if (!errored) {
        throw new Error(
          `no ERRORED build with a log was found for ${readProjectRoot} — this suite reads one as its ` +
            `fixture, so either the project changed or the builds were deleted (harness, not a finding)`
        );
      }
      ({ rawPath, decodedPath } = await downloadBuildLogAsync(run, errored.logFiles[0]));
    });

    it('refuses the bytes as served, because EAS serves a build log brotli-encoded', async () => {
      const result = await runLiveEasAsync(
        run,
        run.tempDir,
        ['inspect:build-log', '--file', rawPath, '--json'],
        {
          label: 'build-log-raw',
        }
      );
      // S8: undecoded input used to be exit 0 with control characters in `logTail`, and "no error
      // located" for binary reads as a build that passed. 22 is the honest answer.
      expectExit(
        result,
        22,
        'a brotli-encoded log is not text, and must not be reported as a passing build'
      );
      const report = parseJson(result);
      expect(report.error.code).toBe('LOG_NOT_TEXT');
      expect(report.error.message).toContain('brotli');
    });

    it('locates the failing phase in the decoded log', async () => {
      const result = await runLiveEasAsync(
        run,
        run.tempDir,
        ['inspect:build-log', '--file', decodedPath, '--json'],
        { label: 'build-log-decoded' }
      );
      expectExit(result, 0);
      const report = parseJson(result);
      expect(report.source.bytes).toBeGreaterThan(1000);
      expect(report.failure).not.toBeNull();
      // The claim is a located line in a real log, not a particular signature: the rules are a capped
      // table and which one matches is a property of the build, so pinning the signature would make
      // this a test of one historical build rather than of the extraction.
      expect(typeof report.failure.signature).toBe('string');
      expect(report.failure.line).toBeGreaterThan(0);
      expect(report.failure.matchedLine.length).toBeGreaterThan(0);
      const phase = report.phases.find((p: any) => p.name === report.failure.phase);
      expect(phase).toBeDefined();
      expect(phase.status).toBe('failed');
      // Every answer carries the line it came from, so it can be checked against the file.
      const lines = fs.readFileSync(decodedPath, 'utf8').split('\n');
      expect(lines[report.failure.line - 1]).toContain(report.failure.matchedLine.slice(0, 40));
    });
  });

  // --- the one write ------------------------------------------------------------------------------

  it('deploy --web ships the fixture, and the URL serves the bytes it produced', async () => {
    const result = await runLiveEasAsync(run, deployProjectRoot, ['deploy', '--web', '--json'], {
      label: 'deploy-web',
    });
    run.spend.deploys += 1;
    expectExit(result, 0);
    const report = parseJson(result);
    expect(report.targets).toEqual(['web']);
    expect(report.web.url).toMatch(/^https:\/\/.+\.staging\.expo\.app$/);
    expect(fs.existsSync(path.join(deployProjectRoot, report.web.exportDir))).toBe(true);

    // The assertion is not "something answered": it is that the address serves the bundle this
    // export produced. The HTML is a shell under `web.output: single`, so the marker lives in the
    // entry bundle the HTML points at, and both halves are checked.
    expect(await httpStatusAsync(report.web.url)).toBe(200);
    const html = await httpBodyAsync(report.web.url);
    run.writeArtifact('deployed-page.html', html);
    expect(html).toContain('<title>Live Check</title>');
    const bundleSrc = /src="([^"]*\/_expo\/static\/js\/web\/[^"]+)"/.exec(html)?.[1];
    expect(bundleSrc).toBeTruthy();
    const bundleUrl = new URL(bundleSrc as string, report.web.url).toString();
    expect(await httpStatusAsync(bundleUrl)).toBe(200);
    expect(await httpBodyAsync(bundleUrl)).toContain('exagent live-eas deploy marker');
  });
});
