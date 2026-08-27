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
// the sequence `beforeAll` performs. Four facts decide the whole shape of this suite — the first three
// from that run, the fourth from this suite's own first live run:
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
//  4. **A session started bare has an app that has never launched, and that is not the same thing as
//     a session with an app on it.** `--expo-go` installs and launches Expo Go; nothing has opened
//     the *project* in it. The first `exp://` URL then goes to the **system**, which asks
//     "Open in 'Expo Go'?" — and nobody is there [S10; and this suite's own first run,
//     2026-08-27: `navigate --cloud` exit 22 after 60.9 s, then two 180 s reloads with zero bundles
//     served]. So the session is started with `--open-url`, which is the runner opening the URL in
//     the app it just launched. Wave 19's working session was in exactly that state before any
//     exagent command touched it.
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
    run.prepare();
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

    // `eas simulator` refuses a project EAS has never heard of, and a scratch scaffold is exactly
    // that. Link it to the suite's standing staging project (the same one `live-eas` deploys to)
    // instead of creating one per run: `eas init --id` is what the refusal itself suggests, but it
    // stops on the slug mismatch in non-interactive mode, so the link is written the way `eas init`
    // would have written it. Identity comes from the committed fixture, not a literal here.
    const fixtureApp = JSON.parse(
      fs.readFileSync(path.join(fixturesDir, 'livecheck', 'app.json'), 'utf8')
    );
    const appJsonPath = path.join(projectRoot, 'app.json');
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    appJson.expo.owner = fixtureApp.expo.owner;
    appJson.expo.slug = fixtureApp.expo.slug;
    appJson.expo.extra = {
      ...appJson.expo.extra,
      eas: { projectId: fixtureApp.expo.extra.eas.projectId },
    };
    fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));

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

    // The session, with `--expo-go` **and `--open-url`**. `eas simulator`, not
    // `eas simulator:start` — see fact 2.
    //
    // `--open-url` is fact 4, and the first live-cloud run is what taught it. A session started bare
    // comes up with Expo Go installed and **never launched**, so the first thing to send it an
    // `exp://` URL hands that URL to the *system* — and iOS answers with "Open in 'Expo Go'?", a
    // modal nothing on an unattended device presses [S10; and live, 2026-08-27: `navigate --cloud`
    // exit 22 after 60.9 s with the `open` verb having exited 0, then two 180 s reloads that served
    // no bundle]. Wave 19's session, the one that reached exit 0, had Expo Go launched *before* any
    // URL reached it (`wave19-live/12-open-session.json`, `open host.exp.Exponent`), and the flag is
    // the EAS runner's own way to arrive in that state: "Expo or development-client URL to open in
    // the installed application **after it launches**" [observed — `eas simulator --help`,
    // eas-cli@latest, 2026-08-27].
    //
    // So the session comes up with the project already loaded, which is what the rest of this suite
    // is about — a reload of an app that is running, not a first launch. The CLI's own answer to the
    // dialog is not what is relied on here: `navigate --cloud` reads and accepts it
    // (`src/navigate/openRoute.ts §resolveOpenDialogAsync`), and this harness gets the session into
    // the state a person following the `eas-simulator` skill would have.
    const started = await easAsync('simulator-start', [
      'simulator',
      '--platform',
      'ios',
      '--type',
      'agent-device',
      '--expo-go',
      '--open-url',
      `exp://${publicHost}`,
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
      // And when nothing attached, the run has to have **looked at the screen** before saying so.
      // S10 is the cause this exit code hid for two rounds: the link went to the system, iOS asked
      // "Open in 'Expo Go'?", and the modal was the whole story. `attachAlert` is that look, and it
      // carries which of the three states it found. `found: false` is the expected one here — the
      // session was started with `--open-url`, so Expo Go was already running when the link arrived.
      expect(report.attachAlert).not.toBeNull();
      expect(report.attachAlert.checked).toBe(true);
      expect(typeof report.attachAlert.reason).toBe('string');
    }
  });

  // @ref llp/0005-runtime-loop-tools.rfc.md §One ladder, chosen by the command socket.
  //
  // **What this asserts is the ladder, not a rung**, and that is a correction the first two live runs
  // between them forced. Written against wave 19 it pinned `method: 'device'` — the relaunch —
  // because wave 19's session held **zero** clients on the dev server's command socket and the
  // broadcast reached nobody. With the session started on the project (fact 4), the same command
  // reported `appsConnected: 1` and `commandSocketClients: 1`: the app registers on that socket
  // through the proxy after all [observed — live cloud, 2026-08-27]. So the rung a cloud session
  // takes is not a constant, and a test that pinned one was asserting the state of one session.
  //
  // What is invariant is the rule: the socket picks the rung, and whichever ran has to prove itself.
  it('runtime:reload --cloud reloads the app and proves it, on whichever rung the socket picked', async () => {
    const result = await runLiveEasAsync(
      run,
      projectRoot,
      ['runtime:reload', '--cloud', '--timeout', RELOAD_TIMEOUT, '--json'],
      { label: 'reload-cloud', env: proxyEnv() }
    );
    expectExit(result, 0);
    const report = parseJson(result);

    expect(report.reloaded).toBe(true);
    // Never a bare success: `reloaded` is `verifiedBy != null` by construction, and this asserts the
    // label is one of the three that can show its own evidence (F95).
    expect(['message-socket-peers', 'app-relaunch', 'fresh-debugger-target', 'dev-server-bundle'])
      .toContain(report.verifiedBy);
    expect(report.bundle.ok).toBe(true);
    expect(report.bundle.url).toContain(publicHost);

    // The two lists, reported side by side because they can disagree here (llp/0005 §Two lists, one
    // question). `commandSocketClients` has to be a number rather than null: "nobody asked" and "nobody
    // is registered" are the two answers this field exists to keep apart.
    expect(typeof report.commandSocketClients).toBe('number');

    // The rung, and the one fact that picked it. This is the assertion that would have caught wave
    // 19's premise going stale: it reads the socket count out of the same report.
    const attempts = Object.fromEntries(report.attempts.map((a: any) => [a.method, a]));
    if (report.commandSocketClients > 0) {
      expect(report.method).toBe('dev-server');
      expect(attempts['dev-server']).toBeTruthy();
    } else {
      expect(report.method).toBe('device');
      // Rung 1 ran and had nobody to broadcast to, and the attempt says so rather than being skipped
      // on the strength of `--cloud` — wave 21's correction.
      expect(attempts['dev-server'].ok).toBe(false);
      expect(attempts['dev-server'].reason).toContain('nothing to broadcast to');
      expect(attempts.device.ok).toBe(true);
      // The cloud relaunch is two verbs, and the reason names both — that is the mechanism, quoted.
      expect(attempts.device.reason).toContain('--relaunch');
      expect(attempts.device.reason).toContain('open');
    }
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
