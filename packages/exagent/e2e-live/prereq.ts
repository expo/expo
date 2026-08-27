// @ref llp/0022-live-tier.plan.md §A suite that cannot run refuses, and says what is missing
//
// Every gate in this file is **synchronous**, and that is the whole design constraint: jest decides
// which suites exist while the module body runs, so `describe.skip` needs its answer before any
// `beforeAll` could have awaited one. Each probe is therefore a `statSync` or one short
// `execFileSync`, and each returns a sentence rather than a boolean — a skipped live suite whose
// reason is "false" tells a reader nothing, and the most common reason (no session, no simulator,
// no `EXPO_STAGING`) is a thing they can fix in one command.
//
// The other half of the design is the direction the gates fail in. A missing prerequisite **skips**:
// this tier runs on the machine of whoever has the prerequisites, and a laptop with no simulator
// reporting a red suite would train everyone to ignore it. A prerequisite that is *present and
// wrong* — `EXPO_STAGING` unset while a suite is about to write to a real account — **throws**,
// because the cost of getting that one wrong is a mutation on production.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/** The answer of one prerequisite probe: usable, or a sentence saying what to do about it. */
export type Gate = { ok: true } | { ok: false; reason: string };

const ok: Gate = { ok: true };

function missing(reason: string): Gate {
  return { ok: false, reason };
}

/** Combine gates in order, so the reason a reader sees is the first thing they have to fix. */
export function allOf(...gates: Gate[]): Gate {
  for (const gate of gates) {
    if (!gate.ok) {
      return gate;
    }
  }
  return ok;
}

/**
 * `describe` when the gate holds, `describe.skip` when it does not — and one printed line either
 * way, because a suite that silently vanishes from the run is the failure mode this tier exists to
 * avoid. jest prints skipped suites without their reason, so the reason is printed here.
 */
export function describeLive(name: string, gate: Gate): jest.Describe {
  if (gate.ok) {
    return describe;
  }
  console.log(`[live] SKIPPED ${name}: ${gate.reason}`);
  return describe.skip;
}

/** The `exagent` bin under test — the ncc bundle, which is what the registry serves. */
export const bin = path.resolve(__dirname, '../bin/exagent.js');

/**
 * That the published surface exists at all.
 *
 * These suites run `bin/exagent.js`, which loads `build/cli/index.js`. That file is the artifact of
 * `pnpm build`, and a stale or absent one is the one prerequisite failure that would make the whole
 * tier a test of nothing.
 */
export function builtBinGate(): Gate {
  const bundle = path.resolve(__dirname, '../build/cli/index.js');
  return fs.existsSync(bundle)
    ? ok
    : missing(`the ncc bundle is not built (${bundle} does not exist) — run "pnpm build" first`);
}

/** macOS, which every simulator gate below is really a gate on. */
export function macosGate(): Gate {
  return process.platform === 'darwin'
    ? ok
    : missing(`a local iOS simulator needs macOS, and this is ${process.platform}`);
}

export type Simulator = { udid: string; name: string };

/**
 * A booted iOS simulator with Expo Go installed on it.
 *
 * Booted rather than bootable on purpose: booting one costs tens of seconds and leaves the machine
 * in a state this suite did not find it in, and "the app opens on the simulator you are looking at"
 * is the thing a live tier is for. `EXAGENT_LIVE_UDID` names one when several are booted.
 */
export function bootedSimulatorGate(): {
  gate: Gate;
  simulator: Simulator | null;
} {
  const mac = macosGate();
  if (!mac.ok) {
    return { gate: mac, simulator: null };
  }

  let listed: string;
  try {
    listed = execFileSync('xcrun', ['simctl', 'list', 'devices', 'booted', '--json'], {
      encoding: 'utf8',
      timeout: 60_000,
    });
  } catch (error: any) {
    return {
      gate: missing(`"xcrun simctl list devices booted" could not run: ${error.message}`),
      simulator: null,
    };
  }

  const wanted = process.env.EXAGENT_LIVE_UDID;
  const booted: Simulator[] = [];
  for (const devices of Object.values(JSON.parse(listed).devices as Record<string, any[]>)) {
    for (const device of devices) {
      if (device.state === 'Booted' && (!wanted || device.udid === wanted)) {
        booted.push({ udid: device.udid, name: device.name });
      }
    }
  }
  if (booted.length === 0) {
    return {
      gate: missing(
        wanted
          ? `no booted simulator has the udid EXAGENT_LIVE_UDID names (${wanted}) — boot it with "xcrun simctl boot ${wanted}"`
          : 'no iOS simulator is booted — boot one ("xcrun simctl boot <udid>" then "open -a Simulator"), or name one with EXAGENT_LIVE_UDID'
      ),
      simulator: null,
    };
  }

  const [simulator] = booted as [Simulator, ...Simulator[]];
  try {
    const apps = execFileSync('xcrun', ['simctl', 'listapps', simulator.udid], {
      encoding: 'utf8',
      timeout: 60_000,
    });
    if (!apps.includes('host.exp.Exponent')) {
      return {
        gate: missing(
          `Expo Go is not installed on ${simulator.name} (${simulator.udid}) — install it, e.g. by running "npx expo start" once and pressing "i"`
        ),
        simulator: null,
      };
    }
  } catch (error: any) {
    return {
      gate: missing(`"xcrun simctl listapps ${simulator.udid}" could not run: ${error.message}`),
      simulator: null,
    };
  }

  return { gate: ok, simulator };
}

/** Expo Go's Android package. One capital letter apart from the iOS one, which is the point. */
export const EXPO_GO_ANDROID_PACKAGE = 'host.exp.exponent';

export type AndroidDevice = {
  /** The `adb` serial, e.g. `emulator-5554`. */
  serial: string;
  /** The `adb` this machine has, so the suite spawns the same one the CLI resolves. */
  adb: string;
  /** The AVD to boot in `beforeAll`, when nothing is attached yet. */
  bootAvd: string | null;
};

/**
 * Where `adb` is on this machine, searched the way `src/device/adb.ts` searches.
 *
 * Reimplemented rather than imported, because this tier runs the **published bundle** and must not
 * share a module with it: a suite that resolved `adb` through the code under test would agree with
 * it by construction, which is exactly what F49 needed a second opinion about. The order is the
 * CLI's own — `ANDROID_HOME`, `ANDROID_SDK_ROOT`, `PATH`, then this platform's default location.
 */
function resolveAdbForSuite(): string | null {
  const executable = process.platform === 'win32' ? 'adb.exe' : 'adb';
  const roots = [process.env.ANDROID_HOME, process.env.ANDROID_SDK_ROOT].filter(Boolean) as string[];
  for (const root of roots) {
    const candidate = path.join(root, 'platform-tools', executable);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  // Resolved to an absolute path rather than left as the bare name, and not for tidiness: the SDK
  // root is `<adb>/../..`, and that is where `emulator` is. A gate that kept the bare name could not
  // find the binary that boots an AVD and reported "no emulator beside that adb" on a machine that
  // has one [observed — the third run of this suite, 2026-08-27].
  try {
    const found = execFileSync(process.platform === 'win32' ? 'where' : 'which', [executable], {
      encoding: 'utf8',
      timeout: 60_000,
    })
      .split('\n')[0]
      ?.trim();
    if (found && fs.existsSync(found)) {
      return fs.realpathSync(found);
    }
  } catch {
    // Not on PATH; fall through to the default install location.
  }
  const home = os.homedir();
  const defaults: Record<string, string[]> = {
    darwin: [path.join(home, 'Library', 'Android', 'sdk')],
    linux: [path.join(home, 'Android', 'Sdk'), path.join(home, 'Android', 'sdk')],
    win32: [path.join(home, 'AppData', 'Local', 'Android', 'Sdk')],
  };
  for (const root of defaults[process.platform] ?? []) {
    const candidate = path.join(root, 'platform-tools', executable);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

/** The `emulator` binary of this SDK — beside the resolved `adb`, or on `PATH`. */
function resolveEmulator(adb: string): string | null {
  const executable = process.platform === 'win32' ? 'emulator.exe' : 'emulator';
  if (adb !== 'adb' && adb !== 'adb.exe') {
    const candidate = path.join(path.dirname(path.dirname(adb)), 'emulator', executable);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  try {
    execFileSync(executable, ['-version'], { stdio: 'ignore', timeout: 60_000 });
    return executable;
  } catch {
    return null;
  }
}

/**
 * An Android device this suite can drive: attached now, or an AVD it may boot.
 *
 * Deliberately **not** the shape of {@link bootedSimulatorGate}, and the difference is a machine
 * fact rather than a preference. A booted iOS simulator is something the owner of the machine is
 * usually looking at, so `live-local` refuses to boot one. An Android emulator is not: it is started
 * for a task and shut afterwards, and requiring one to be up already would mean this suite never
 * ran. So a listed AVD is enough to pass, and `beforeAll` boots it — about 40 s, which the RUNBOOK
 * prices.
 *
 * Two things the reason has to say when they are missing, because each is one command:
 *
 *  - **No `adb`.** F49's own trap, from the other side: on a machine with the SDK installed the
 *    normal way and `platform-tools` never put on `PATH`, the bare name fails — so this searches
 *    where the CLI searches and, failing that, says which variable would settle it.
 *  - **`-ports 5554,5555`.** An emulator started without it binds ephemeral ports and `adb` never
 *    discovers it [observed — friction run 6, F62; and again 2026-08-27]. A gate that printed a
 *    plain `emulator -avd <name>` would send a reader into that for a second time.
 */
export function androidDeviceGate(): { gate: Gate; device: AndroidDevice | null } {
  const adb = resolveAdbForSuite();
  if (!adb) {
    return {
      gate: missing(
        'no "adb" could be found: it is not on PATH, ANDROID_HOME and ANDROID_SDK_ROOT name nothing, ' +
          `and there is no SDK at this platform's default location. Install the Android SDK ` +
          'platform-tools and set ANDROID_HOME to the SDK root'
      ),
      device: null,
    };
  }

  let attached: string[] = [];
  try {
    const listed = execFileSync(adb, ['devices'], { encoding: 'utf8', timeout: 60_000 });
    attached = listed
      .split('\n')
      .slice(1)
      .map((line) => line.trim().split(/\s+/))
      .filter(([serial, state]) => serial && state === 'device')
      .map(([serial]) => serial!);
  } catch (error: any) {
    return {
      gate: missing(`"${adb} devices" could not run: ${error.message}`),
      device: null,
    };
  }

  if (attached.length > 0) {
    const serial = attached[0]!;
    // Only checkable for a device that is already up; the boot path checks it in `beforeAll`, which
    // is a failure rather than a skip and the RUNBOOK says why.
    try {
      const packages = execFileSync(adb, ['-s', serial, 'shell', 'pm', 'list', 'packages'], {
        encoding: 'utf8',
        timeout: 120_000,
      });
      if (!packages.includes(EXPO_GO_ANDROID_PACKAGE)) {
        return {
          gate: missing(
            `Expo Go is not installed on ${serial} — install it by running "npx expo start --android" ` +
              `once against any project, or "${adb} install <Expo Go apk>"`
          ),
          device: null,
        };
      }
    } catch (error: any) {
      return {
        gate: missing(`"${adb} -s ${serial} shell pm list packages" could not run: ${error.message}`),
        device: null,
      };
    }
    return { gate: ok, device: { serial, adb, bootAvd: null } };
  }

  const emulator = resolveEmulator(adb);
  if (!emulator) {
    return {
      gate: missing(
        `no Android device is attached to "${adb} devices", and no "emulator" binary was found ` +
          `beside that adb or on PATH to boot one with. Attach a device, or install the SDK's ` +
          `emulator package (\`sdkmanager emulator\`)`
      ),
      device: null,
    };
  }
  let avds: string[] = [];
  try {
    avds = execFileSync(emulator, ['-list-avds'], { encoding: 'utf8', timeout: 60_000 })
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  } catch (error: any) {
    return {
      gate: missing(`"${emulator} -list-avds" could not run: ${error.message}`),
      device: null,
    };
  }
  const wanted = process.env.EXAGENT_LIVE_AVD;
  const avd = wanted ? avds.find((name) => name === wanted) : avds[0];
  if (!avd) {
    return {
      gate: missing(
        wanted
          ? `no AVD is named ${wanted} (EXAGENT_LIVE_AVD); "${emulator} -list-avds" reports ${avds.length ? avds.join(', ') : 'none'}`
          : `no Android device is attached and this machine has no AVD to boot — create one in ` +
            `Android Studio's Device Manager, or with "${path.join(path.dirname(path.dirname(adb)), 'cmdline-tools', 'latest', 'bin', 'avdmanager')} create avd -n tuft-pixel -k "system-images;android-35;google_apis;arm64-v8a""`
      ),
      device: null,
    };
  }
  return { gate: ok, device: { serial: '', adb, bootAvd: avd } };
}

/** Where the Expo CLI family keeps the session, per {@link stagingGate}'s environment. */
export const STAGING_SESSION_FILE = path.join(os.homedir(), '.expo-staging', 'state.json');

/**
 * `EXPO_STAGING=1` **and** a session in the staging state file.
 *
 * Two facts, one gate, because either alone is useless: the environment variable without a session
 * gets a suite of login prompts, and the session without the variable is a suite that would write
 * to production. The hard half — the variable being *absent* while an EAS suite runs — is
 * {@link assertStaging}, which throws rather than skips.
 */
export function stagingGate(): { gate: Gate; user: string | null } {
  if (process.env.EXPO_STAGING !== '1') {
    return {
      gate: missing(
        'EXPO_STAGING=1 is not set — the EAS suites only ever run against staging, so they refuse rather than touch a real account'
      ),
      user: null,
    };
  }
  let user: string | null = null;
  try {
    user = JSON.parse(fs.readFileSync(STAGING_SESSION_FILE, 'utf8'))?.auth?.username ?? null;
  } catch {
    user = null;
  }
  if (!user) {
    return {
      gate: missing(
        `no staging session was found in ${STAGING_SESSION_FILE} — sign in with "EXPO_STAGING=1 npx exagent login"`
      ),
      user: null,
    };
  }
  return { gate: ok, user };
}

/**
 * The hard guard: this process is not allowed to talk to production, ever.
 *
 * Called from every EAS-touching helper rather than once in a `beforeAll`, and it throws rather
 * than skips. A suite that skips when it cannot reach staging has cost nobody anything; a suite
 * that runs `eas deploy` against production because a variable was dropped somewhere between the
 * gate and the spawn has, and no amount of gate at the top of the file prevents that — only a
 * check at the call site does.
 */
export function assertStaging(what: string): void {
  if (process.env.EXPO_STAGING !== '1') {
    throw new Error(
      `Refusing to run ${what}: EXPO_STAGING is not "1", and this tier never touches a production account. ` +
        `Re-run with EXPO_STAGING=1, or let the suite skip.`
    );
  }
}

/** An EAS-linked project on disk to read builds from, copied read-only into the scratch area. */
export function easProjectGate(): { gate: Gate; source: string | null } {
  const source = path.resolve(
    process.env.EXAGENT_LIVE_EAS_PROJECT ?? path.join(os.homedir(), 'Developer', 'DailyWords-Grok')
  );
  if (!fs.existsSync(path.join(source, 'package.json'))) {
    return {
      gate: missing(
        `no EAS-linked project to read builds from: ${source} has no package.json — point EXAGENT_LIVE_EAS_PROJECT at one that has finished EAS builds on staging`
      ),
      source: null,
    };
  }
  let projectId: string | null = null;
  try {
    const config = JSON.parse(fs.readFileSync(path.join(source, 'app.json'), 'utf8'));
    projectId = config?.expo?.extra?.eas?.projectId ?? null;
  } catch {
    projectId = null;
  }
  if (!projectId) {
    return {
      gate: missing(
        `${source} is not linked to an EAS project (no expo.extra.eas.projectId in its app.json), so there are no builds to look up`
      ),
      source: null,
    };
  }
  return { gate: ok, source };
}

/** A package runner, which is the only way this CLI reaches the EAS CLI since wave 18. */
export function packageRunnerGate(): Gate {
  for (const runner of ['bunx', 'npx']) {
    try {
      execFileSync(runner, ['--version'], { stdio: 'ignore', timeout: 60_000 });
      return ok;
    } catch {
      // Try the next one.
    }
  }
  return missing('neither "bunx" nor "npx" is on PATH, so the EAS CLI cannot be reached at all');
}

/** Network egress to the staging API, so a suite does not report an offline laptop as a bug. */
export function networkGate(): Gate {
  try {
    execFileSync(
      'curl',
      ['-sS', '-o', '/dev/null', '-m', '20', '-w', '%{http_code}', 'https://staging.expo.dev'],
      { encoding: 'utf8', timeout: 40_000 }
    );
    return ok;
  } catch (error: any) {
    return missing(`https://staging.expo.dev could not be reached: ${error.message}`);
  }
}

/**
 * The second opt-in `live-cloud` needs, and why it is not a prerequisite.
 *
 * Every other gate in this file is a fact about the machine. This one is an *intention*, because
 * `live-cloud`'s prerequisites can all hold on a machine whose owner did not mean to start a billing
 * EAS Simulator session from a test run. A session bills from `eas simulator` until
 * `eas simulator:stop`, so it is asked for by name or not at all.
 */
export function cloudOptInGate(): Gate {
  return process.env.EXAGENT_LIVE_CLOUD === '1'
    ? ok
    : missing(
        'EXAGENT_LIVE_CLOUD=1 is not set — an EAS Simulator session bills from start to stop, so this suite never runs without being asked for by name'
      );
}

/**
 * A way to give the dev server an origin a datacenter can reach — and **not** `@expo/ngrok`.
 *
 * A cloud simulator cannot load `exp://127.0.0.1:<port>`, and cannot load a LAN address either. The
 * documented answer is `expo start --tunnel`, and on this machine that answer does not work: the Expo
 * CLI logs `Tunnel URL not found … falling back to LAN URL` twelve times and then exits 1 on
 * `TypeError: Cannot read properties of undefined (reading 'body')` with a pointer at ngrok's status
 * page [observed — wave19-live, `01-dev-tunnel.err`, 2026-08-27]. So the gate is not "is ngrok
 * installed": it is "is there a way to publish a local port", which here is `tuft host`.
 *
 * `EXAGENT_LIVE_PUBLIC_ORIGIN` is the escape hatch for a machine with a different one — a reverse
 * proxy, a Cloudflare tunnel, an ngrok that actually starts. The suite sets `EXPO_PACKAGER_PROXY_URL`
 * to whatever this resolves to; wave 19 taught `src/dev/advertisedUrl.ts` to read a proxy origin out
 * of the dev server's manifest, because a proxied run prints `Waiting on http://localhost:<port>` and
 * names the real origin only in `launchAsset.url`.
 */
export function publicOriginGate(): Gate {
  if (process.env.EXAGENT_LIVE_PUBLIC_ORIGIN) {
    return ok;
  }
  try {
    execFileSync('tuft', ['host', 'list'], { stdio: 'ignore', timeout: 60_000 });
    return ok;
  } catch {
    return missing(
      'no way to publish a local port: "tuft host" could not run, and EXAGENT_LIVE_PUBLIC_ORIGIN is ' +
        'not set. A cloud simulator cannot reach 127.0.0.1 or a LAN address, and "expo start --tunnel" ' +
        'does not start on this machine (@expo/ngrok exits 1 — see wave19-live/01-dev-tunnel.err), so ' +
        'the dev server needs a proxy origin instead'
    );
  }
}
