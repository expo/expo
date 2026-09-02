/* eslint-env jest */
// @ref llp/0024-cli-ui.rfc.md §The program names itself
//
// The acceptance test for the rule: **program output never hardcodes the program's name.**
//
// It is at this tier because the claim is about the *shipped* package. A unit test can only show
// that the renderer reads a constant, and a constant can be inlined at build time — which is what
// an `import name from '../package.json'` does, and it would pass every in-process check while
// shipping a bundle that says whatever the build machine was called. So the subject here is the
// built package, copied out of the source tree, with its `package.json` edited **after** the build
// and before the run. Nothing but a runtime read can make this pass.
//
// The reverse case is asserted too. A resolver that quietly fell back to its own constant would
// pass a "renaming works" test only by never doing anything, so the unmodified copy has to answer
// with the real name — and the real name has to be read, not assumed, so it comes from the
// `package.json` this test copied.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { stripVTControlCharacters } from 'node:util';

import { getTemporaryPath } from '../utils';

/** The package under test: the two directories `files` publishes, plus the manifest. */
const PACKAGE_ROOT = path.resolve(__dirname, '../..');
const PUBLISHED = ['bin', 'build', 'package.json'];

/**
 * A name no part of this package spells, in either of its two histories.
 *
 * Not the old name and not a near-miss of it: `src/__tests__/oldName-test.ts` fails on the old name
 * anywhere in the tree, including in this file, and a test whose fixture data breaks another suite
 * is a test that gets deleted rather than read.
 */
const RENAMED = 'renamed-test-cli';

/** The name in the real manifest, read rather than written out, for the unmodified case. */
const REAL_NAME = (
  JSON.parse(fs.readFileSync(path.join(PACKAGE_ROOT, 'package.json'), 'utf8')) as { name: string }
).name;

/**
 * Copy the built package somewhere else and run it there.
 *
 * Somewhere else because the point is that nothing outside the copy is consulted: a resolver that
 * walked up to the monorepo, or one that read the source tree it was built from, would answer with
 * the real name from inside the renamed copy and the rename assertions would fail here rather than
 * in a user's terminal.
 */
async function installCopyAsync(name: string | null): Promise<string> {
  const root = path.join(getTemporaryPath(), 'program-name');
  await fs.promises.mkdir(root, { recursive: true });
  for (const entry of PUBLISHED) {
    await fs.promises.cp(path.join(PACKAGE_ROOT, entry), path.join(root, entry), {
      recursive: true,
    });
  }
  if (name != null) {
    const manifest = path.join(root, 'package.json');
    const parsed = JSON.parse(await fs.promises.readFile(manifest, 'utf8')) as { name: string };
    parsed.name = name;
    await fs.promises.writeFile(manifest, `${JSON.stringify(parsed, null, 2)}\n`);
  }
  return root;
}

/** Run the copied CLI, from a directory that is not the copy, and collect everything it printed. */
async function runAsync(
  root: string,
  args: string[]
): Promise<{ exitCode: number | null; all: string }> {
  const cwd = getTemporaryPath();
  await fs.promises.mkdir(cwd, { recursive: true });
  const { npm_config_minimum_release_age, ...processEnv } = process.env;

  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(root, 'bin', 'cli.js'), ...args], {
      cwd,
      env: { ...processEnv, CI: '1', FORCE_COLOR: '0', NO_COLOR: '1' },
    });
    let all = '';
    child.stdout.on('data', (chunk) => (all += chunk));
    child.stderr.on('data', (chunk) => (all += chunk));
    child.on('error', reject);
    child.on('close', (exitCode) =>
      resolve({ exitCode, all: stripVTControlCharacters(all) })
    );
  });
}

describe('the name in the output', () => {
  it(`is the one in package.json, when nothing was edited`, async () => {
    const root = await installCopyAsync(null);

    const help = await runAsync(root, ['--help']);

    expect(help.exitCode).toBe(0);
    expect(help.all).toContain(`npx ${REAL_NAME} <command> [options]`);
    expect(help.all).toContain(`New here? npx ${REAL_NAME} help workflow`);
    expect(help.all).not.toContain(RENAMED);
  });

  it(`follows package.json when it is edited after the build`, async () => {
    const root = await installCopyAsync(RENAMED);

    const help = await runAsync(root, ['--help']);

    expect(help.exitCode).toBe(0);
    expect(help.all).toContain(`npx ${RENAMED} <command> [options]`);
    expect(help.all).toContain(`New here? npx ${RENAMED} help workflow`);
    // The whole screen, not one line of it: a banner that follows the rename over a usage line that
    // does not is the failure this is here to catch.
    expect(help.all).not.toContain(REAL_NAME);
  });

  it(`follows package.json in one command's help`, async () => {
    const root = await installCopyAsync(RENAMED);

    const help = await runAsync(root, ['status', '--help']);

    expect(help.exitCode).toBe(0);
    expect(help.all).toContain(`npx ${RENAMED} status`);
    expect(help.all).not.toContain(REAL_NAME);
  });

  it(`follows package.json in the "Try:" line of a failing command`, async () => {
    const root = await installCopyAsync(RENAMED);

    const failed = await runAsync(root, ['nonsense']);

    // The recovery an agent is handed after a name it got wrong: the sentence about the command,
    // and the line it is told to run instead. Both name the program.
    expect(failed.exitCode).not.toBe(0);
    expect(failed.all).toContain(`"${RENAMED} nonsense" is not a command`);
    expect(failed.all).toContain(`Try: npx ${RENAMED} --help`);
    expect(failed.all).not.toContain(REAL_NAME);
  });

  it(`follows package.json in the workflow topic`, async () => {
    const root = await installCopyAsync(RENAMED);

    const workflow = await runAsync(root, ['help', 'workflow']);

    expect(workflow.exitCode).toBe(0);
    expect(workflow.all).toContain(`npx ${RENAMED} status`);
    expect(workflow.all).not.toContain(REAL_NAME);
  });
});
