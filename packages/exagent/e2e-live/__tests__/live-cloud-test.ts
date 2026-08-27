/* eslint-env jest */
// @ref llp/0022-live-tier.plan.md §live-cloud: written, gated, and not yet run
//
// The cloud-simulator half of the live tier. **Written and not yet run by its author** [2026-08-27,
// wave 20]: the staging cloud-session budget belonged to another wave while this was being written, so
// llp/0019 §The live matrix marks these rows `runnable` rather than filled, and nothing here may be
// read as evidence until somebody has seen it green.
//
// Every expectation in this file comes from wave 19's live run rather than from the type definitions:
// `wave19-live/` holds the JSON each assertion below was written against, and the sequence it proved is
// the sequence `beforeAll` performs. Three facts from that run decide the whole shape of this suite:
//
//  1. **The dev server needs a public origin, and a tunnel is not how it gets one here.**
//     `exp://127.0.0.1:<port>` names the loopback of the machine that opens it, and that machine is in
//     a datacenter. `--tunnel` is the documented answer and it **does not work on this machine**: the
//     Expo CLI logs `Tunnel URL not found … falling back to LAN URL` twelve times and then exits 1 on
//     `TypeError: Cannot read properties of undefined (reading 'body')` [observed — wave19-live,
//     `01-dev-tunnel.err`]. What works is a proxy origin: `tuft host add <port>` for a public name and
//     `EXPO_PACKAGER_PROXY_URL` so the dev server advertises it. Wave 19 taught `advertisedUrl` to read
//     that origin out of the manifest rather than the log, because a proxied run prints
//     `Waiting on http://localhost:<port>` and puts the real origin only in `launchAsset.url`.
//  2. **A bare cloud session has no app on it.** A session started without `--expo-go` comes up with
//     nothing installed, `apps --platform ios` lists only the controller's own test runner, and every
//     `open` of an `exp://` URL fails with `LSApplicationWorkspaceErrorDomain error 115` [observed —
//     wave19-live, `08-open-plain.json`]. The command is `eas simulator … --expo-go`, and it is
//     `eas simulator` rather than `eas simulator:start` — that is the name in the CLI's own manifest
//     and the one that carries the flag.
//  3. **A cloud reload is a relaunch, proved on the dev server.** Wave 19: `method: "device"`,
//     `verifiedBy: "dev-server-bundle"`, and `commandSocketClients` reported beside `appsConnected`
//     because the two disagree exactly here — an app bundling over a proxy is in the debugger list and
//     holds **zero** clients on the command socket, so a broadcast reaches nobody. The `dev-server`
//     attempt is therefore *not tried* on a cloud session, with a reason that says so.
//
// What this suite still may not assert: `attached`. S11 — a cloud simulator registers zero CDP targets
// over both the local and the proxy origin — so `navigate --cloud` asserts the link was opened and
// nothing more, and there is deliberately no `runtime:eval --cloud` test, because the flag does not
// exist. That is correct, and what this suite pins is that the CLI is honest about a wall upstream of
// it.
//
// Cost: an EAS Simulator session bills from start to stop. Hence two opt-ins — `test:live:cloud` and
// `EXAGENT_LIVE_CLOUD=1` — one session started in `beforeAll`, reused by every test, and stopped in
// `afterAll` whatever happened.

import fs from 'node:fs';
import path from 'node:path';

import {
  allOf,
  builtBinGate,
  cloudOptInGate,
  describeLive,
  networkGate,
  packageRunnerGate,
  publicOriginGate,
  stagingGate,
} from '../prereq';
import {
  LiveRun,
  execAsync,
  expectExit,
  findFreePortAsync,
  fixturesDir,
  parseJson,
  runLiveEasAsync,
  waitForAsync,
} from '../utils';

const staging = stagingGate();
const gate = allOf(
  builtBinGate(),
  cloudOptInGate(),
  staging.gate,
  packageRunnerGate(),
  networkGate(),
  publicOriginGate()
);

/**
 * How long a cloud step gets.
 *
 * Wave 19's successful reload reported `waitedMs: 89913`, and a later one `15179` — two runs of the
 * same command an order of magnitude apart, which is what a datacenter round trip plus a cold Expo Go
 * plus a bundle over a proxy costs. So the bound is generous and the command is given a matching
 * `--timeout`; nothing here asserts how long anything took.
 */
const BOUND_MS = 300_000;

/** What `--timeout` is set to on a cloud reload, spelled the way that option parses. */
const RELOAD_TIMEOUT = '180s';

/** The route the lab screen lives at, for the reload that names one. */
const LAB_ROUTE = '/lab';

describeLive('live-cloud', gate)('live-cloud: an EAS Simulator session, on staging', () => {
  const run = new LiveRun('live-cloud');
  let projectRoot = '';
  let port = 0;
  /** The `tuft host` name this run created, or the host of a caller-supplied origin. */
  let hostName = '';
  /** The origin the dev server advertises, e.g. `https://exagent-live-8500.tuft.host`. */
  let origin = '';
  /** Host and port of {@link origin}, which is what an `exp://` link carries. */
  let publicHost = '';
  let sessionId: string | null = null;

  /** `eas` through the same package runner this CLI uses, on staging, with the evidence kept. */
  async function easAsync(label: string, args: string[]) {
    const result = await execAsync('npx', ['--yes', 'eas-cli@latest', ...args], {
      cwd: projectRoot || run.tempDir,
      env: { EXPO_STAGING: '1' },
      timeoutMs: BOUND_MS,
    });
    run.writeArtifact(
      `eas-${label}.txt`,
      `$ eas ${args.join(' ')}\nexit ${result.exitCode}\n\n${result.stdout}\n${result.stderr}`
    );
    return result;
  }

  /** The environment every command in this suite needs, so the dev server advertises the origin. */
  function proxyEnv() {
    return { EXPO_PACKAGER_PROXY_URL: origin };
  }

  beforeAll(async () => {
    port = await findFreePortAsync();

    const created = await runLiveEasAsync(
      run,
      run.tempDir,
      ['new', 'cloudapp', '--name', 'Cloud App', '--json'],
      { label: 'new' }
    );
    run.spend.scaffolds += 1;
    expectExit(created, 0);
    projectRoot = parseJson(created).projectRoot;

    // The lab screen, so the `--route` reload has somewhere to go that is not the root. Same fixture
    // and same tab-trigger insertion as `live-local`; see that file for why it is an insertion.
    fs.writeFileSync(
      path.join(projectRoot, 'src', 'app', 'lab.tsx'),
      fs.readFileSync(path.join(fixturesDir, 'lab', 'lab.tsx'), 'utf8')
    );
    const tabsFile = path.join(projectRoot, 'src', 'components', 'app-tabs.tsx');
    const tabs = fs.readFileSync(tabsFile, 'utf8');
    const anchor = '</NativeTabs>';
    if (!tabs.includes(anchor)) {
      throw new Error(
        `the scaffold's ${tabsFile} has no ${anchor} to insert the lab tab trigger before — the template ` +
          `changed shape, so this harness needs updating (not a finding about the CLI)`
      );
    }
    fs.writeFileSync(
      tabsFile,
      tabs.replace(
        anchor,
        `  <NativeTabs.Trigger name="lab">\n` +
          `        <NativeTabs.Trigger.Label>Lab</NativeTabs.Trigger.Label>\n` +
          `      </NativeTabs.Trigger>\n    ${anchor}`
      )
    );

    // Cleanups run newest-first, so these are registered cheapest-first: the session that bills is
    // registered last and therefore ends first, and the directory the others run in is deleted last.
    run.onCleanup('scratch project', () => {
      if (!process.env.EXAGENT_LIVE_KEEP) {
        fs.rmSync(run.tempDir, { recursive: true, force: true });
      }
    });
    run.onCleanup('tuft host stop', async () => {
      // Only what this suite created. An origin the caller supplied is theirs, and taking it down would
      // be a cleanup acting outside its own run.
      if (hostName && !process.env.EXAGENT_LIVE_PUBLIC_ORIGIN) {
        const stopped = await execAsync('tuft', ['host', 'stop', hostName], { timeoutMs: 120_000 });
        run.writeArtifact('cleanup-host-stop.txt', stopped.stdout + stopped.stderr);
      }
    });
    run.onCleanup('dev:stop', async () => {
      await runLiveEasAsync(run, projectRoot, ['dev:stop', '--json'], {
        label: 'cleanup-dev-stop',
      });
    });
    run.onCleanup('eas simulator:stop', async () => {
      // Unconditional, and it deliberately does not check `sessionId` first: the failure worth guarding
      // is a session that started and whose id this process never learned. `--id` when there is one,
      // because a project can have several and stopping somebody else's is not this suite's to do.
      const args = ['simulator:stop', '--non-interactive'];
      await easAsync('simulator-stop', sessionId ? [...args, '--id', sessionId] : args);
    });

    // A public origin. Either one the caller already has — a reverse proxy, a Cloudflare tunnel, an
    // ngrok that actually starts — or one from `tuft host`. `--force` because a re-run reuses the name,
    // and a name left pointing at a dead port by a crashed run must not stop this one.
    if (process.env.EXAGENT_LIVE_PUBLIC_ORIGIN) {
      origin = process.env.EXAGENT_LIVE_PUBLIC_ORIGIN.replace(/\/+$/, '');
      hostName = new URL(origin).host;
      console.log(
        `[live] using EXAGENT_LIVE_PUBLIC_ORIGIN (${origin}); it has to already forward to port ${port}`
      );
    } else {
      hostName = `exagent-live-${port}`;
      const hosted = await execAsync(
        'tuft',
        ['host', 'add', String(port), '--name', hostName, '--force'],
        { timeoutMs: 120_000 }
      );
      run.writeArtifact('tuft-host-add.txt', hosted.stdout + hosted.stderr);
      if (hosted.exitCode !== 0) {
        throw new Error(
          `"tuft host add ${port}" failed (exit ${hosted.exitCode}): ${hosted.stderr.slice(-1000)}`
        );
      }
      origin = `https://${hostName}.tuft.host`;
    }
    publicHost = new URL(origin).host;

    // The dev server, told to advertise that origin. **Not** `--tunnel`: see the header, fact 1.
    const dev = await runLiveEasAsync(
      run,
      projectRoot,
      ['dev', '--detach', '--wait-ready', '--port', String(port), '--json'],
      { label: 'dev-proxy', env: proxyEnv() }
    );
    expectExit(dev, 0);
    expect(parseJson(dev).port).toBe(port);

    // That the origin actually reached the world, checked before a session is billed to find out.
    // `--print-url` needs no device and is the cheapest question with this answer.
    const printed = await runLiveEasAsync(
      run,
      projectRoot,
      ['navigate', '/', '--print-url', '--json'],
      {
        label: 'print-url',
        env: proxyEnv(),
      }
    );
    expectExit(printed, 0);
    const printedReport = parseJson(printed);
    if (printedReport.hostType !== 'tunnel' || !String(printedReport.url).includes(publicHost)) {
      throw new Error(
        `the dev server is not advertising the public origin ${origin}: navigate --print-url reported ` +
          `hostType ${printedReport.hostType} and url ${printedReport.url}. A cloud simulator cannot ` +
          `reach it, so no session is worth starting. Evidence: ${printed.artifact}`
      );
    }

    // The session, with `--expo-go`. `eas simulator`, not `eas simulator:start` — see fact 2.
    const started = await easAsync('simulator-start', [
      'simulator',
      '--platform',
      'ios',
      '--type',
      'agent-device',
      '--expo-go',
      '--non-interactive',
      '--name',
      'exagent-live',
      '--json',
    ]);
    if (started.exitCode !== 0) {
      throw new Error(
        `eas simulator failed (exit ${started.exitCode}): ${started.stderr.slice(-2000)}`
      );
    }
    run.spend.cloudSessions += 1;
    sessionId = JSON.parse(started.stdout)?.id ?? null;
    if (!sessionId) {
      throw new Error(
        `eas simulator --json printed no session id: ${started.stdout.slice(0, 500)}`
      );
    }
  });

  afterAll(async () => {
    await run.cleanUpAsync();
    console.log(run.costLine());
  });

  it('the session this suite started is the one the CLI finds', async () => {
    expect(sessionId).toBeTruthy();
    // The CLI reads the session out of `.env.eas-simulator`, which `eas simulator` writes into the
    // project. That file is the handshake between the two CLIs, so its absence is the first thing to
    // know about rather than something to discover three tests later.
    const envFile = path.join(projectRoot, '.env.eas-simulator');
    expect(await waitForAsync(() => fs.existsSync(envFile), 60_000, 2_000)).toBe(true);
    expect(fs.readFileSync(envFile, 'utf8')).toContain(sessionId as string);
  });

  it('navigate --cloud opens the route on the cloud simulator, over the public origin', async () => {
    const result = await runLiveEasAsync(run, projectRoot, ['navigate', '/', '--cloud', '--json'], {
      label: 'navigate-cloud',
      env: proxyEnv(),
    });
    const report = parseJson(result);
    // `DeviceBackend` is `'cloud'` — one value for both platforms, with `platform` carrying the rest.
    expect(report.deviceBackend).toBe('cloud');
    expect(report.platform).toBe('ios');
    // The URL has to name the public origin, not this machine. A localhost URL here is the S3 failure,
    // and it would be opened onto an error screen rather than refused.
    expect(report.url).toContain(publicHost);
    expect(report.hostType).toBe('tunnel');
    // The `open` itself succeeded: this is the half `--expo-go` fixed, and the half that answered
    // `LSApplicationWorkspaceErrorDomain error 115` without it.
    expect(report.exitCode).toBe(0);
    // `attached` is **not** asserted true: S11 says a cloud simulator registers zero CDP targets, so 22
    // with `attached: false` is the honest outcome today. If this ever becomes 0-and-attached, the wall
    // has moved and the branch below is what will say so.
    expect([0, 22]).toContain(result.exitCode);
    if (result.exitCode === 22) {
      expect(report.attached).toBe(false);
    }
  });

  it('runtime:reload --cloud relaunches the app and proves it on the dev server', async () => {
    const result = await runLiveEasAsync(
      run,
      projectRoot,
      ['runtime:reload', '--cloud', '--timeout', RELOAD_TIMEOUT, '--json'],
      { label: 'reload-cloud', env: proxyEnv() }
    );
    expectExit(result, 0);
    const report = parseJson(result);

    // Wave 19's contract, field by field, against `wave19-live/22-reload4.json`.
    expect(report.reloaded).toBe(true);
    expect(report.method).toBe('device');
    // The third proof, and the only one a cloud simulator leaves: the dev server was seen to serve a
    // bundle after the relaunch. Not peer churn — there is no client — and not a fresh debugger target,
    // because S11 means there is no target at all.
    expect(report.verifiedBy).toBe('dev-server-bundle');
    expect(report.bundlesAfterReload.observed).toBe(true);
    expect(report.bundlesAfterReload.count).toBeGreaterThan(0);
    expect(report.bundlesAfterReload.line).toContain('Bundled');
    expect(report.bundle.ok).toBe(true);
    expect(report.bundle.url).toContain(publicHost);

    // The two lists, reported side by side because they disagree here (llp/0005 §Two lists, one
    // question). `commandSocketClients` has to be a number rather than null: "nobody asked" and "nobody
    // is registered" are the two answers this field exists to keep apart.
    expect(typeof report.commandSocketClients).toBe('number');

    // The dev-server broadcast is skipped on a cloud session, and the skip carries its reason. A run
    // that quietly tried it and reported 0 clients as a reload is what wave 19 fixed.
    const attempts = Object.fromEntries(report.attempts.map((a: any) => [a.method, a]));
    expect(attempts['dev-server'].ok).toBe(false);
    expect(attempts['dev-server'].reason).toContain('not tried');
    expect(attempts.device.ok).toBe(true);
    // The relaunch is two verbs, and the reason names both — that is the mechanism, quoted.
    expect(attempts.device.reason).toContain('--relaunch');
    expect(attempts.device.reason).toContain('open');
  });

  it('runtime:reload --cloud --route puts the app on the route it names', async () => {
    const result = await runLiveEasAsync(
      run,
      projectRoot,
      ['runtime:reload', '--cloud', '--route', LAB_ROUTE, '--timeout', RELOAD_TIMEOUT, '--json'],
      { label: 'reload-cloud-route', env: proxyEnv() }
    );
    expectExit(result, 0);
    const report = parseJson(result);
    expect(report.reloaded).toBe(true);
    expect(report.route).toBe(LAB_ROUTE);
    expect(report.routeCheck.ok).toBe(true);
    // The link that was opened, on the public origin. A flag that names a target *is* the target
    // (llp/0021), so a route reload that opened the root would be a wrong report, not a slow one.
    expect(report.url).toBe(`exp://${publicHost}/--${LAB_ROUTE}`);
  });

  it('smoke --cloud reports the phases it could reach, and stays on the backend it was given', async () => {
    const result = await runLiveEasAsync(run, projectRoot, ['smoke', '--cloud', '--json'], {
      label: 'smoke-cloud',
      env: proxyEnv(),
    });
    const report = parseJson(result);
    // 20 and 22 are both possible and both honest: S11 means the runtime phase has nothing to read, and
    // "could not decide" is the answer for that. What is asserted is which device it was about.
    expect([0, 20, 22]).toContain(result.exitCode);
    expect(report.deviceBackend).toBe('cloud');
    // llp/0019 bug 5: a cloud run that found nothing used to be answered with `--ios` follow-ups —
    // "this is what opens one on a booted device" — to a host that reached for the cloud precisely
    // because it has no booted device. Every follow-up of a `--cloud` run stays off the local flags.
    for (const followup of report.followups ?? []) {
      if (followup.command.includes('exagent')) {
        expect(followup.command).not.toMatch(/--ios\b|--android\b/);
      }
    }
  });

  it('runtime:stop --cloud ends the app without ending the session', async () => {
    const result = await runLiveEasAsync(run, projectRoot, ['runtime:stop', '--cloud', '--json'], {
      label: 'stop-cloud',
      env: proxyEnv(),
    });
    expectExit(result, 0);
    const report = parseJson(result);
    expect(report.deviceBackend).toBe('cloud');
    // S13: the follow-up asserted "the app was not running" while `wasRunning` was null — which is the
    // one thing the cloud backend cannot know, because its verb succeeds for any app id. Null is the
    // honest value here; a `false` would be a claim.
    expect([true, null]).toContain(report.wasRunning);

    // S12: a failed cloud verb used to close the controller session and leave the device unusable
    // without saying so. Stopping the app is not stopping the session, and the service is the witness.
    const listed = await easAsync('simulator-list', [
      'simulator:list',
      '--status',
      'in-progress',
      '--non-interactive',
      '--json',
    ]);
    expect(listed.stdout).toContain(sessionId as string);
  });

  it('a --cloud run against a platform the session is not is refused, not opened', async () => {
    const result = await runLiveEasAsync(
      run,
      projectRoot,
      ['navigate', '/', '--cloud', '--android', '--json'],
      { label: 'navigate-cloud-mismatch', env: proxyEnv() }
    );
    // llp/0019 §What is still not tested — "a session has one platform" was the unasserted row. The
    // session here is iOS, so an `--android` run has to be refused rather than opened onto nothing.
    expect(result.exitCode).not.toBe(0);
    const report = parseJson(result);
    expect(JSON.stringify(report)).toMatch(/platform/i);
  });
});
