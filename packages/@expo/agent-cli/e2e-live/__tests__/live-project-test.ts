/* eslint-env jest */
// @ref llp/0022-live-tier.plan.md §live-project: the commands whose backend is the project
// @ref llp/0019-backend-parity-audit.plan.md §The live matrix — the `open — stub-only, by choice`
// column this suite exists to fill.
//
// The commands the audit called "argv assembly or filesystem work with no second process boundary":
// `install` **adding** a package, `agents:setup`, `skills:sync/list/show/clean`,
// `inspect:config-plugins`, `start`, and the forwarded `expo` set. The claim was reasonable and it
// was not measured, and measuring it cost five findings — **F130** to **F134** — every one of them
// in the half of the work the stub could not double.
//
// **Why this is a suite of its own rather than rows in `live-local`.** Its gate is the network and
// nothing else. `live-local` needs a booted iOS simulator with Expo Go on it, and not one command
// here touches a device: an install talks to the registry, `agents:setup` and `skills:*` write
// files, `inspect:config-plugins` spawns the project's own `expo`, and `start` is asserted by the
// port answering rather than by anything on a screen. Folding these into `live-local` would make
// them unrunnable on every machine without a simulator — which is most machines, including the ones
// where a "does the real registry still serve this" answer is most wanted.
//
// **What the stub tier could not have said**, in one line each:
//
//  - **`install` resolves against the registry and the Expo CLI rewrites the project.** A real
//    `expo install expo-build-properties` **adds the plugin to `app.json`** ("Added config plugin"),
//    which is what makes the classifier's `is listed in the app.json plugins` reason reachable at
//    all. No stub rewrites the caller's config.
//  - **The `--check` report has two shapes and only one of them is single-line** (F130).
//  - **`bundledNativeModules.json` is real**, so `expo-haptics` is a `native-module` whose action is
//    `reload` — the row that made the follow-up's "Only JavaScript changed" a contradiction (F134).
//  - **The fingerprint cache is invalidated by an install without anybody dropping it**, because
//    `package.json` and the lockfile are pinned sentinels ([[0023-fingerprint-caching]] §What
//    invalidates an answer). Asserted here rather than assumed.
//  - **No published Expo module ships `skills/*/SKILL.md`**, so the discovery this suite exercises
//    is over a skill written into `node_modules` the way a module author would ship one. That
//    finding is asserted too, because it is the feature's reach.
//  - **A forwarded command is bare.** `exagent config --json` and `npx expo config --json` are
//    compared byte for byte, which is the only form of "nothing was added" worth the name.

import fs from 'node:fs';
import path from 'node:path';

import { allOf, builtBinGate, describeLive, registryGate } from '../prereq';
import {
  LIVE_PORT_BASE,
  LiveRun,
  expectExit,
  findFreePortAsync,
  httpStatusAsync,
  parseJson,
  runLiveAsync,
  waitForAsync,
} from '../utils';

const gate = allOf(builtBinGate(), registryGate());

/** Generous, because a real `npm install` against the registry is what most of these wait on. */
const BOUND_MS = 120_000;

/** The port `start` runs on. Chosen in `beforeAll`; above the Expo CLI's own 8081–8085 sweep. */
let PORT = LIVE_PORT_BASE;

describeLive('live-project', gate)('live-project: the commands whose backend is the project', () => {
  const run = new LiveRun('live-project');
  let projectRoot = '';
  /** The scaffold's own dependency ranges, so nothing below pins an SDK 57 version by hand. */
  let scaffoldedDependencies: Record<string, string> = {};

  beforeAll(async () => {
    run.prepare();
    PORT = await findFreePortAsync();

    // The scaffold is the setup for everything below, so it is asserted here: a `beforeAll` that
    // fails is reported by jest as this suite failing, which is what it is.
    const created = await runLiveAsync(
      run,
      run.tempDir,
      ['new', 'projapp', '--name', 'Proj App', '--no-git', '--json'],
      { label: 'new' }
    );
    run.spend.scaffolds += 1;
    expectExit(created, 0, 'the scaffold every test below runs against');
    projectRoot = parseJson(created).projectRoot;
    expect(fs.existsSync(path.join(projectRoot, 'node_modules', 'expo'))).toBe(true);
    scaffoldedDependencies = JSON.parse(
      fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8')
    ).dependencies;

    // Registered before anything that needs them: a failure anywhere below still stops the dev
    // server, and the directory the others run *in* is deleted last (`onCleanup` is newest-first).
    run.onCleanup('scratch project', () => {
      if (!process.env.EXAGENT_LIVE_KEEP) {
        fs.rmSync(run.tempDir, { recursive: true, force: true });
      }
    });
    run.onCleanup('dev:stop', async () => {
      await runLiveAsync(run, projectRoot, ['dev:stop', '--json'], { label: 'cleanup-dev-stop' });
    });
  });

  afterAll(async () => {
    await run.cleanUpAsync();
    console.log(run.costLine());
  });

  /** Read the project's static app config as it is on disk right now. */
  function appConfig(): any {
    return JSON.parse(fs.readFileSync(path.join(projectRoot, 'app.json'), 'utf8'));
  }

  /** The `freshness.hashSource` of a `status --json` run, which says cache or computed. */
  async function hashSourceAsync(label: string): Promise<any> {
    const result = await runLiveAsync(run, projectRoot, ['status', '--json'], { label });
    expectExit(result, 0);
    return parseJson(result).freshness.hashSource;
  }

  // --- install, actually adding packages ---------------------------------------------------------

  describe('install', () => {
    // The row the audit read `open — every run would install from the registry; the --check path
    // proves the wrapper`. It does not: `--check` never resolves a version, never writes
    // `package.json` and never gives the classifier a package to look at.
    it('adds a native module Expo Go carries, and says a reload is enough without claiming why wrongly', async () => {
      const result = await runLiveAsync(run, projectRoot, ['install', 'expo-haptics', '--json'], {
        label: 'install-haptics',
      });

      expectExit(result, 0);
      const payload = parseJson(result);
      expect(payload.installed).toBe(true);
      expect(payload.impact).toHaveLength(1);
      const [impact] = payload.impact;
      // Real `node_modules`: the package ships native directories, and the real
      // `bundledNativeModules.json` says the Expo Go runtime already has it.
      expect(impact.packageName).toBe('expo-haptics');
      expect(impact.impact).toBe('native-module');
      expect(impact.expoGoBundled).toBe(true);
      expect(impact.action).toBe('reload');
      expect(impact.reasons).toContain('ships an ios/ directory');

      // F134: this exact pair of facts — `native-module` and `reload` — is what the follow-up used
      // to answer with "Only JavaScript changed", inside the same object that says it ships an
      // `ios/` directory.
      const reload = payload.followups.find((entry: any) => entry.id === 'reload-app');
      expect(reload).toBeTruthy();
      expect(reload.why).not.toContain('Only JavaScript changed');
      expect(reload.why).toContain('Expo Go');

      // And it really is in the manifest, which is the half `--check` never reaches.
      const manifest = JSON.parse(
        fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8')
      );
      expect(manifest.dependencies['expo-haptics']).toBeTruthy();
    });

    // The invalidation row of llp/0023 §What invalidates an answer, measured rather than reasoned
    // about: nothing drops the record on an install, and nothing has to — `package.json` and the
    // lockfile are pinned, so the key misses by itself.
    it('leaves the fingerprint record in place and misses its key anyway', async () => {
      const cold = await hashSourceAsync('status-cold');
      expect(cold.source).toBe('computed');
      const warm = await hashSourceAsync('status-warm');
      expect(warm.source).toBe('cache');
      expect(warm.revalidatedAgainst).toBeGreaterThan(0);

      const recordPath = path.join(projectRoot, '.expo', 'exagent-fingerprint.json');
      expect(fs.existsSync(recordPath)).toBe(true);

      const installed = await runLiveAsync(
        run,
        projectRoot,
        ['install', 'expo-clipboard', '--json'],
        { label: 'install-clipboard' }
      );
      expectExit(installed, 0);

      // The record is still there — `install` does not call `clearFingerprintMemo`, unlike `dev`
      // after a plan step — and the next read misses it, because two pinned files moved.
      expect(fs.existsSync(recordPath)).toBe(true);
      const after = await hashSourceAsync('status-after-install');
      expect(after.source).toBe('computed');
    });

    // Only a real `expo install` rewrites the caller's `app.json`, and the classifier's
    // `is listed in the … plugins` reason is unreachable without that write.
    it('lets the Expo CLI add a config plugin to app.json, and reports it as one', async () => {
      expect(appConfig().expo.plugins).not.toContain('expo-build-properties');

      const result = await runLiveAsync(
        run,
        projectRoot,
        ['install', 'expo-build-properties', '--json'],
        { label: 'install-build-properties' }
      );

      expectExit(result, 0);
      const [impact] = parseJson(result).impact;
      expect(impact.impact).toBe('config-plugin');
      expect(impact.reasons).toContain('ships an app.plugin.js config plugin');
      expect(impact.reasons).toContain('is listed in the app.json plugins');
      expect(appConfig().expo.plugins).toContain('expo-build-properties');
    });

    // A package outside `bundledNativeModules.json`, which is the only way to reach the rebuild
    // ladder for real: the running app cannot load it, whatever the project is targeting.
    it('says a package the runtime does not carry needs a build', async () => {
      const result = await runLiveAsync(run, projectRoot, ['install', 'react-native-mmkv', '--json'], {
        label: 'install-mmkv',
      });

      expectExit(result, 0);
      const payload = parseJson(result);
      const [impact] = payload.impact;
      expect(impact.impact).toBe('native-module');
      expect(impact.expoGoBundled).toBe(false);
      expect(impact.action).toBe('prebuild-and-build');
      const dev = payload.followups.find((entry: any) => entry.id === 'dev');
      expect(dev.command).toBe('npx exagent dev');
      expect(dev.why).toContain('react-native-mmkv');
    });

    it('installs a dev dependency as one, classified js-only', async () => {
      const result = await runLiveAsync(run, projectRoot, ['install', 'prettier', '--dev', '--json'], {
        label: 'install-dev-dep',
      });

      expectExit(result, 0);
      const [impact] = parseJson(result).impact;
      expect(impact.impact).toBe('js-only');
      expect(impact.action).toBe('reload');
      expect(impact.reasons).toContain('ships no native code and no config plugin');
      const manifest = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
      expect(manifest.devDependencies.prettier).toBeTruthy();
      expect(manifest.dependencies.prettier).toBeUndefined();
    });

    // The adversarial input: a package the registry does not have. The contract is that a `--json`
    // caller still gets one object, and the registry's own diagnosis is on stderr rather than
    // nowhere (F29's rule, at the other end).
    it('prints one object and the package manager’s diagnosis for a package that does not exist', async () => {
      const result = await runLiveAsync(
        run,
        projectRoot,
        ['install', 'expo-definitely-not-a-real-package-w31', '--json'],
        { label: 'install-nonexistent' }
      );

      expect(result.exitCode).toBe(1);
      const payload = parseJson(result);
      expect(payload.installed).toBe(false);
      expect(payload.exitCode).toBe(1);
      expect(payload.impact).toEqual([]);
      // The reason came from the package manager, three process boundaries out, and it is on the
      // stream a person reads rather than in the object a parser reads — this command's stated
      // split. Asserted on the status code rather than on a code word, because *which* package
      // manager answers is not this suite's to fix: `create-expo` picks it from the environment, so
      // a run launched through `npx pnpm` scaffolds a pnpm project and gets `ERR_PNPM_FETCH_404`
      // where a plain `npm` scaffold gets `npm error code E404` [observed — wave 31, both].
      expect(result.stderr).toContain('404');
      expect(result.stderr).toContain('expo-definitely-not-a-real-package-w31');
    });

    // F130. The pass and the failure of `--check` are printed in two different shapes by the Expo
    // CLI, and the failing one is the only one with an answer in it.
    it('carries the real --check report on both sides of a version mismatch', async () => {
      const clean = await runLiveAsync(run, projectRoot, ['install', '--check', '--json'], {
        label: 'install-check-clean',
      });
      expectExit(clean, 0);
      expect(parseJson(clean).check.report.upToDate).toBe(true);

      // Install a version the SDK does not want, the way a stale lockfile leaves one behind. It has
      // to be *installed* rather than only written into `package.json`: `--check` compares the
      // resolved version in `node_modules` against the SDK's range, so editing the manifest alone
      // leaves the check honestly green [observed — the first run of this suite].
      const pinned = await runLiveAsync(
        run,
        projectRoot,
        ['install', 'expo-haptics@14.0.1', '--json'],
        { label: 'install-old-haptics' }
      );
      expectExit(pinned, 0);

      const mismatched = await runLiveAsync(run, projectRoot, ['install', '--check', '--json'], {
        label: 'install-check-mismatch',
      });
      expect(mismatched.exitCode).toBe(1);
      const check = parseJson(mismatched).check;
      expect(check.ok).toBe(false);
      // The whole finding: this used to be null, with the answer stringified into `check.output`.
      expect(check.report).not.toBeNull();
      expect(check.report.upToDate).toBe(false);
      const named = check.report.dependencies.map((entry: any) => entry.packageName);
      expect(named).toContain('expo-haptics');

      const fixed = await runLiveAsync(run, projectRoot, ['install', '--fix', '--json'], {
        label: 'install-fix',
      });
      expectExit(fixed, 0);
      const after = await runLiveAsync(run, projectRoot, ['install', '--check', '--json'], {
        label: 'install-check-after-fix',
      });
      expectExit(after, 0);
      expect(parseJson(after).check.report.upToDate).toBe(true);
    });

    it('refuses a flag neither CLI has before spawning anything', async () => {
      const result = await runLiveAsync(run, projectRoot, ['install', 'expo-image', '--wat', '--json'], {
        label: 'install-bad-flag',
      });

      expect(result.exitCode).toBe(1);
      expect(parseJson(result).error.code).toBe('BAD_ARGS');
      // Nothing ran, which is what makes this worth asserting live: the rejection happens before
      // the spawn, so the manifest the scaffold wrote is the manifest on disk.
      const manifest = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
      expect(manifest.dependencies['expo-image']).toBe(scaffoldedDependencies['expo-image']);
    });
  });

  // --- agents:setup --------------------------------------------------------------------------

  describe('agents:setup', () => {
    // The scaffold ships an `AGENTS.md` of its own, which is the case that matters: this command
    // maintains one block inside a file somebody else wrote.
    it('appends its managed block to the scaffold’s own AGENTS.md', async () => {
      const before = fs.readFileSync(path.join(projectRoot, 'AGENTS.md'), 'utf8');
      expect(before).not.toContain('BEGIN EXAGENT MANAGED BLOCK');

      const result = await runLiveAsync(run, projectRoot, ['agents:setup', '--json'], {
        label: 'agents-setup',
      });

      expectExit(result, 0);
      const payload = parseJson(result);
      expect(payload.agentsMd).toEqual({ path: 'AGENTS.md', action: 'updated' });
      expect(payload.skills.synced).toBe(true);

      const after = fs.readFileSync(path.join(projectRoot, 'AGENTS.md'), 'utf8');
      // Byte-for-byte: the user's file is a prefix of the result, with the block appended.
      expect(after.startsWith(before.replace(/\n+$/, ''))).toBe(true);
      expect(after).toContain('BEGIN EXAGENT MANAGED BLOCK');
      expect(after).toContain('END EXAGENT MANAGED BLOCK');
      // The block describes the project it was run in, read rather than templated.
      expect(after).toContain('- Project: projapp');
      expect(after).toContain('npx exagent status');
    });

    it('changes nothing on a second run, and says so', async () => {
      const before = fs.readFileSync(path.join(projectRoot, 'AGENTS.md'), 'utf8');

      const result = await runLiveAsync(run, projectRoot, ['agents:setup', '--json'], {
        label: 'agents-setup-again',
      });

      expectExit(result, 0);
      expect(parseJson(result).agentsMd.action).toBe('skipped');
      expect(fs.readFileSync(path.join(projectRoot, 'AGENTS.md'), 'utf8')).toBe(before);
    });

    // The contract the managed block exists for: everything outside the markers is the user's, and
    // everything inside it is this command's.
    it('keeps a user edit outside the block and overwrites one inside it', async () => {
      const filePath = path.join(projectRoot, 'AGENTS.md');
      const edited = `# My own heading\n\n${fs
        .readFileSync(filePath, 'utf8')
        .replace('- Project: projapp', '- Project: projapp <!-- user scribble -->')}\n## My own trailing section\nDo not touch this.\n`;
      fs.writeFileSync(filePath, edited);

      const result = await runLiveAsync(run, projectRoot, ['agents:setup', '--json'], {
        label: 'agents-setup-user-edit',
      });

      expectExit(result, 0);
      expect(parseJson(result).agentsMd.action).toBe('updated');
      const after = fs.readFileSync(filePath, 'utf8');
      expect(after).toContain('# My own heading');
      expect(after).toContain('## My own trailing section');
      expect(after).toContain('Do not touch this.');
      expect(after).not.toContain('user scribble');
    });

    // The adversarial input, and the only destructive mistake this command could make.
    it('refuses a block with no end marker rather than rewriting past it', async () => {
      const filePath = path.join(projectRoot, 'AGENTS.md');
      const good = fs.readFileSync(filePath, 'utf8');
      fs.writeFileSync(filePath, good.replace('<!-- END EXAGENT MANAGED BLOCK -->', '<!-- gone -->'));

      const result = await runLiveAsync(run, projectRoot, ['agents:setup', '--json'], {
        label: 'agents-setup-unclosed',
      });

      expect(result.exitCode).toBe(1);
      expect(parseJson(result).error.code).toBe('AGENTS_MD_UNCLOSED_BLOCK');
      // The user's trailing section is exactly what a rewrite past the missing marker would eat.
      expect(fs.readFileSync(filePath, 'utf8')).toContain('## My own trailing section');

      fs.writeFileSync(filePath, good);
    });
  });

  // --- skills:*, against skills that really are in node_modules ---------------------------------

  describe('skills', () => {
    /** Where a module author would put a skill, in a package this project really has installed. */
    function skillDir(packageName: string): string {
      return path.join(projectRoot, 'node_modules', packageName, 'skills', packageName);
    }

    // The finding that comes first, because it decides what the rest of this block has to do.
    it('finds no skills at all in a real dependency graph, which is the feature’s reach today', async () => {
      const result = await runLiveAsync(run, projectRoot, ['skills:list', '--json'], {
        label: 'skills-list-empty',
      });

      expectExit(result, 0);
      // Not an assertion about these packages being wrong: `llp/0003` §Skills shipped from Expo
      // modules is a direction, and the four reference PRs are unmerged. Ten packages were probed
      // in wave 31 — six installed, four straight off the registry — and none ships
      // `skills/*/SKILL.md`. If that changes this test is the one that says so.
      expect(parseJson(result).skills).toEqual([]);
    });

    it('discovers a skill a package ships, through real autolinking', async () => {
      fs.mkdirSync(skillDir('expo-haptics'), { recursive: true });
      fs.writeFileSync(
        path.join(skillDir('expo-haptics'), 'SKILL.md'),
        '---\nname: expo-haptics\ndescription: Trigger haptic feedback.\n---\n\nUse `impactAsync`.\n'
      );

      const result = await runLiveAsync(run, projectRoot, ['skills:list', '--json'], {
        label: 'skills-list-real',
      });

      expectExit(result, 0);
      const { skills } = parseJson(result);
      expect(skills).toHaveLength(1);
      expect(skills[0].package).toBe('expo-haptics');
      expect(skills[0].description).toBe('Trigger haptic feedback.');
      // Nothing is linked yet, and the report says which directories were looked in.
      expect(skills[0].linkedIn).toEqual([]);
    });

    it('links it as a relative symlink and lists it in .gitignore', async () => {
      const result = await runLiveAsync(
        run,
        projectRoot,
        ['skills:sync', '--agent', 'claude-code', '--json'],
        { label: 'skills-sync' }
      );

      expectExit(result, 0);
      const payload = parseJson(result);
      expect(payload.linked).toEqual([path.join('.claude', 'skills', 'expo-haptics')]);
      expect(payload.skipped).toEqual([]);

      const link = path.join(projectRoot, '.claude', 'skills', 'expo-haptics');
      expect(fs.lstatSync(link).isSymbolicLink()).toBe(true);
      // Relative, so the project survives being moved.
      expect(path.isAbsolute(fs.readlinkSync(link))).toBe(false);
      expect(fs.readFileSync(path.join(link, 'SKILL.md'), 'utf8')).toContain('impactAsync');
      expect(fs.readFileSync(path.join(projectRoot, '.gitignore'), 'utf8')).toContain(
        '.claude/skills/expo-haptics'
      );
    });

    it('prints the SKILL.md with skills:show, and refuses a name it does not have', async () => {
      const shown = await runLiveAsync(run, projectRoot, ['skills:show', 'expo-haptics'], {
        label: 'skills-show',
      });
      expectExit(shown, 0);
      expect(shown.stdout).toContain('Use `impactAsync`.');

      const missing = await runLiveAsync(run, projectRoot, ['skills:show', 'expo-haptics', 'nope'], {
        label: 'skills-show-missing',
      });
      expect(missing.exitCode).toBe(1);
      expect(missing.stderr).toContain('No skill named "nope"');
      // The refusal names what there is, which is the recovery.
      expect(missing.stderr).toContain('expo-haptics');
    });

    it('creates nothing on a second sync', async () => {
      const result = await runLiveAsync(run, projectRoot, ['skills:sync', '--json'], {
        label: 'skills-sync-again',
      });

      expectExit(result, 0);
      const payload = parseJson(result);
      expect(payload.linked).toEqual([]);
      expect(payload.removed).toEqual([]);
      expect(payload.skipped).toEqual([]);
    });

    // F131. The guard holds — and until wave 31 the report said nothing about the skill it held on.
    it('reports a skill it could not link because the user owns the name', async () => {
      const link = path.join(projectRoot, '.claude', 'skills', 'expo-haptics');
      fs.rmSync(link, { recursive: true, force: true });
      fs.mkdirSync(link, { recursive: true });
      fs.writeFileSync(path.join(link, 'SKILL.md'), '# my own skill\n');

      const result = await runLiveAsync(run, projectRoot, ['skills:sync', '--json'], {
        label: 'skills-sync-collision',
      });

      expectExit(result, 0);
      const payload = parseJson(result);
      expect(payload.linked).toEqual([]);
      expect(payload.skipped).toEqual([
        {
          link: path.join('.claude', 'skills', 'expo-haptics'),
          package: 'expo-haptics',
          skill: 'expo-haptics',
          reason: 'occupied',
        },
      ]);
      // What the guard is for.
      expect(fs.readFileSync(path.join(link, 'SKILL.md'), 'utf8')).toBe('# my own skill\n');

      fs.rmSync(link, { recursive: true, force: true });
      await runLiveAsync(run, projectRoot, ['skills:sync', '--json'], { label: 'skills-resync' });
    });

    it('prunes the link of a skill that is gone', async () => {
      fs.rmSync(path.join(projectRoot, 'node_modules', 'expo-haptics', 'skills'), {
        recursive: true,
        force: true,
      });

      const result = await runLiveAsync(run, projectRoot, ['skills:sync', '--json'], {
        label: 'skills-sync-prune',
      });

      expectExit(result, 0);
      expect(parseJson(result).removed).toEqual([path.join('.claude', 'skills', 'expo-haptics')]);
    });

    it('cleans only the links it made', async () => {
      // A skill to clean, and a file beside it that is the user's.
      fs.mkdirSync(skillDir('expo-clipboard'), { recursive: true });
      fs.writeFileSync(
        path.join(skillDir('expo-clipboard'), 'SKILL.md'),
        '---\nname: expo-clipboard\n---\n\nCopy things.\n'
      );
      await runLiveAsync(run, projectRoot, ['skills:sync', '--json'], { label: 'skills-sync-clip' });
      const own = path.join(projectRoot, '.claude', 'skills', 'MY-OWN-NOTES.md');
      fs.writeFileSync(own, 'mine\n');

      const result = await runLiveAsync(run, projectRoot, ['skills:clean', '--json'], {
        label: 'skills-clean',
      });

      expectExit(result, 0);
      expect(parseJson(result).removed).toContain(path.join('.claude', 'skills', 'expo-clipboard'));
      expect(fs.existsSync(own)).toBe(true);
      // The generated block goes with the last link, so a clean leaves no stale entries behind.
      expect(fs.readFileSync(path.join(projectRoot, '.gitignore'), 'utf8')).not.toContain(
        '@generated expo skills start'
      );
    });

    // The guard wave 16 added, and the one place this group's four actions do not agree: `clean` is
    // cleanup rather than action on an app, so it answers where the other three refuse (llp/0020).
    it('cleans in a directory that is not an Expo app, where list and sync refuse', async () => {
      const notExpo = path.join(run.tempDir, 'notexpo');
      fs.mkdirSync(notExpo, { recursive: true });
      fs.writeFileSync(
        path.join(notExpo, 'package.json'),
        JSON.stringify({ name: 'notexpo', version: '1.0.0' }, null, 2)
      );

      const cleaned = await runLiveAsync(run, notExpo, ['skills:clean', '--json'], {
        label: 'skills-clean-notexpo',
      });
      expectExit(cleaned, 0);
      expect(parseJson(cleaned).removed).toEqual([]);

      for (const action of ['list', 'sync']) {
        const refused = await runLiveAsync(run, notExpo, [`skills:${action}`, '--json'], {
          label: `skills-${action}-notexpo`,
        });
        expect(refused.exitCode).toBe(1);
        expect(parseJson(refused).error.code).toBe('NOT_EXPO_APP');
      }
    });
  });

  // --- inspect:config-plugins ------------------------------------------------------------------

  describe('inspect:config-plugins', () => {
    it('reads the real introspected config, plugins and autolinked modules included', async () => {
      const result = await runLiveAsync(run, projectRoot, ['inspect:config-plugins', '--json'], {
        label: 'inspect-plugins',
      });

      expectExit(result, 0);
      const payload = parseJson(result);
      expect(payload.source.command).toEqual(['expo', 'config', '--type', 'introspect', '--json']);
      expect(payload.configuredSdkVersion).toMatch(/^\d+\.\d+\.\d+$/);
      // A real introspection compiles the mods, so the Info.plist is a real one.
      expect(Object.keys(payload.platforms.ios.infoPlist).length).toBeGreaterThan(10);
      expect(payload.platforms.android.manifest.manifest['uses-permission'].length).toBeGreaterThan(
        1
      );
      // The autolinked list is Expo modules, from the real resolver.
      expect(payload.expoAutolinkedModules).toContain('expo-router');
      expect(payload.notAttributable).toEqual(['ios.xcodeproj', '*.dangerous']);
    });

    // F132. The scaffold declares three plugins and the real `pluginHistory` recorded one of them;
    // `expo-router` is in neither, having modified the Info.plist all the same.
    it('names the declared plugins the real plugin history has no entry for', async () => {
      const declared: string[] = appConfig().expo.plugins.map((entry: unknown) =>
        Array.isArray(entry) ? entry[0] : entry
      );
      expect(declared.length).toBeGreaterThan(1);

      const result = await runLiveAsync(run, projectRoot, ['inspect:config-plugins', '--json'], {
        label: 'inspect-plugins-declared',
      });
      const payload = parseJson(result);

      const accounted = payload.plugins
        .filter((plugin: any) => plugin.declared)
        .map((plugin: any) => plugin.name);
      // Every declared id is either accounted for or named as unaccounted for. That is the
      // invariant, and the count in the human line used to satisfy neither half.
      for (const id of declared) {
        expect(accounted.concat(payload.declaredNotApplied)).toContain(id);
      }

      const human = await runLiveAsync(run, projectRoot, ['inspect:config-plugins'], {
        label: 'inspect-plugins-human',
      });
      expectExit(human, 0);
      if (payload.declaredNotApplied.length) {
        expect(human.stdout).toContain('declared not in the history');
        expect(human.stdout).toContain(payload.declaredNotApplied[0]);
      }
    });

    // F133. The adversarial config, and the one the whole command is about: an entry that cannot be
    // resolved. `@expo/config-plugins` says why on its first line and then prints ten frames.
    it('quotes the real reason a broken plugin entry failed, not the stack under it', async () => {
      const configPath = path.join(projectRoot, 'app.json');
      const good = fs.readFileSync(configPath, 'utf8');
      const broken = JSON.parse(good);
      broken.expo.plugins.push('./plugins/withNothingHere');
      fs.writeFileSync(configPath, JSON.stringify(broken, null, 2));

      try {
        const result = await runLiveAsync(run, projectRoot, ['inspect:config-plugins', '--json'], {
          label: 'inspect-plugins-broken',
        });

        expect(result.exitCode).toBe(1);
        const error = parseJson(result).error;
        expect(error.code).toBe('CONFIG_INTROSPECT_FAILED');
        expect(error.message).toContain('Failed to resolve plugin for module');
        expect(error.message).toContain('./plugins/withNothingHere');
        // The frames are diagnostic detail and were the whole of the `Why:` line before wave 31.
        expect(error.message).not.toContain('at resolvePluginForModule');
        expect(error.suggestedCommand).toBe('npx expo config --type introspect --json');
      } finally {
        fs.writeFileSync(configPath, good);
      }
    });

    it('rejects a --file that names no native file without spawning expo', async () => {
      const result = await runLiveAsync(
        run,
        projectRoot,
        ['inspect:config-plugins', '--file', 'AndroidManifest.xml', '--json'],
        { label: 'inspect-plugins-bad-file' }
      );

      expect(result.exitCode).toBe(1);
      expect(parseJson(result).error.code).toBe('BAD_ARGS');
      expect(parseJson(result).error.message).toContain('infoPlist');
    });
  });

  // --- start, and the forwarded expo set --------------------------------------------------------

  describe('start', () => {
    // `start` is `expo start` with a follow-up ladder in front of it and a skill sync behind it.
    // Both halves are asserted, and the dev server itself is asserted by the port answering.
    it('starts a real dev server and syncs the skills a few seconds later', async () => {
      // A skill to sync, removed from the agent directory so the sync has something to do.
      const shipped = path.join(
        projectRoot,
        'node_modules',
        'expo-clipboard',
        'skills',
        'expo-clipboard'
      );
      expect(fs.existsSync(shipped)).toBe(true);
      const link = path.join(projectRoot, '.claude', 'skills', 'expo-clipboard');
      fs.rmSync(link, { recursive: true, force: true });

      const started = runLiveAsync(run, projectRoot, ['start', '--port', String(PORT)], {
        label: 'start',
      });

      const up = await waitForAsync(
        async () => (await httpStatusAsync(`http://127.0.0.1:${PORT}/status`)) === 200,
        BOUND_MS,
        1_000
      );
      expect(up).toBe(true);

      // llp/0003 §Migration item 1: the sync runs a few seconds after the dev server is up, from
      // this command rather than from a hook inside `@expo/cli`.
      const relinked = await waitForAsync(() => fs.existsSync(link), 30_000, 1_000);
      expect(relinked).toBe(true);

      const stopped = await runLiveAsync(run, projectRoot, ['dev:stop', '--json'], {
        label: 'dev-stop-after-start',
      });
      expectExit(stopped, 0);
      const result = await started;
      // The ladder is printed before the bundler takes the terminal, which is the only place it can
      // be read at all — and on a machine with no device it must not say `navigate`.
      expect(result.all).toContain('Suggested next:');
    });

    it('hands a flag the Expo CLI does not know to the Expo CLI', async () => {
      const result = await runLiveAsync(run, projectRoot, ['start', '--wat'], {
        label: 'start-bad-flag',
      });

      expect(result.exitCode).toBe(1);
      // The Expo CLI's own words, with no envelope of ours around them: this command interprets
      // nothing it does not own.
      expect(result.all).toContain('unknown or unexpected option: --wat');
      expect(result.all).not.toContain('BAD_ARGS');
    });
  });

  describe('the forwarded expo set', () => {
    // The strongest available form of "nothing was added": the two stdouts are compared byte for
    // byte against the same project at the same moment.
    it('is byte-identical to running expo itself', async () => {
      const forwarded = await runLiveAsync(run, projectRoot, ['config', '--json'], {
        label: 'forwarded-config',
      });
      expectExit(forwarded, 0);

      const { command, args } = require('../../src/utils/expoCli').resolveExpoCli(projectRoot, [
        'config',
        '--json',
      ]);
      const direct = require('node:child_process').execFileSync(command, [...args], {
        cwd: projectRoot,
        encoding: 'utf8',
        env: { ...process.env, NODE_ENV: undefined, FORCE_COLOR: '0', NO_COLOR: '1' },
      });

      expect(forwarded.stdout).toBe(direct);
      // No follow-ups, no probe, no envelope — a forward adds nothing at all.
      expect(forwarded.stdout).not.toContain('Suggested next:');
      expect(forwarded.stderr).toBe('');
    });

    it('keeps the Expo CLI’s own exit code and message for a flag it rejects', async () => {
      const result = await runLiveAsync(run, projectRoot, ['config', '--wat'], {
        label: 'forwarded-config-bad-flag',
      });

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('unknown or unexpected option: --wat');
      expect(result.stdout).toBe('');
    });

    // llp/0010 §Registry rules, rule 2: a group named after a forwarded command owns its colon
    // forms and nothing else, so the space form is two arguments for `expo config`.
    it('forwards the space form rather than resolving it as a group action', async () => {
      const result = await runLiveAsync(run, projectRoot, ['config', 'doctor'], {
        label: 'forwarded-config-space-form',
      });

      expect(result.exitCode).toBe(1);
      // `expo config` read `doctor` as a project root, which is what forwarding it means.
      expect(result.all).toContain('Invalid project root');
      expect(result.all).toContain('doctor');
    });

    it('runs a forwarded command that really does something', async () => {
      const result = await runLiveAsync(run, projectRoot, ['export', '--platform', 'web'], {
        label: 'forwarded-export',
      });

      expectExit(result, 0);
      // The artifact is the assertion: a forward that assembled argv and never spawned would pass
      // every other check in this file.
      expect(fs.existsSync(path.join(projectRoot, 'dist', 'index.html'))).toBe(true);
    });

    it('answers whoami --json itself, and forwards the bare form', async () => {
      const bare = await runLiveAsync(run, projectRoot, ['whoami'], { label: 'whoami' });
      // Exit 0 logged in, 1 logged out: either is the Expo CLI's answer and neither is a finding.
      expect([0, 1]).toContain(bare.exitCode);

      const json = await runLiveAsync(run, projectRoot, ['whoami', '--json'], {
        label: 'whoami-json',
      });
      const payload = parseJson(json);
      // The one documented exception to bare forwarding: this CLI answers with one object.
      expect(typeof payload.loggedIn).toBe('boolean');
      expect(payload.sessionFile).toContain('state.json');
    });
  });
});
