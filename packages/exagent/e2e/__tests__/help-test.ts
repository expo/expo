/* eslint-env jest */
// @ref llp/0024-cli-ui.rfc.md
//
// The help surface at the process boundary: what an agent that has been handed this CLI and
// nothing else actually gets back, and with which exit code.
//
// The unit suite (`src/help/__tests__/template-test.ts`) checks the template over every command in
// the registry, which is the part that can drift silently. What only a spawned process can answer
// is the rest of the contract: that a help request exits 0, that it is on stdout, that the on-ramp
// is reachable by all three spellings a caller will try, and that a `--json` run in a pipe carries
// no escape sequences into the object.
import { executeExagentAsync, setupFixtureAsync } from '../utils';

describe('npx exagent --help', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await setupFixtureAsync('go-app');
  });

  it('points at the on-ramp, and leaves the map to it', async () => {
    const result = await executeExagentAsync(projectRoot, ['--help']);

    expect(result.exitCode).toBe(0);
    // The map lives in `help workflow` alone; the top level carries the pointer and the listing.
    expect(result.stdout).not.toContain('What to run, in order');
    expect(result.stdout).toContain('New here? npx exagent help workflow');
    expect(result.stdout).toContain('status');
    expect(result.stdout).toContain('smoke');
  });
});

// The on-ramp is the thing a caller has to find *before* they know anything, so it answers to the
// topic name, and every near miss is answered with the line that works rather than with a listing.
describe('the on-ramp', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await setupFixtureAsync('go-app');
  });

  it('answers `help workflow` with the whole protocol', async () => {
    const result = await executeExagentAsync(projectRoot, ['help', 'workflow']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('What to run, in order');
    // The four things a driving agent has to know before its first command is worth running.
    expect(result.stdout).toContain('Exit codes');
    expect(result.stdout).toContain('--json');
    expect(result.stdout).toContain('Try:');
    expect(result.stdout).toContain('npx exagent status --explain');
  });

  // A topic is a positional, so the wrong shapes are a colon, a bare verb, and the name this topic
  // had for one unpublished day. Each is one hop from the line that works.
  it.each([['help:workflow'], ['workflow'], ['help:how-to'], ['how-to'], ['--how-to']])(
    'sends %s to `npx exagent help workflow`',
    async (typed) => {
      const result = await executeExagentAsync(projectRoot, [typed], { reject: false });

      expect(result.exitCode).not.toBe(0);
      expect(result.all).toContain('Try: npx exagent help workflow');
    }
  );

  it('names the exit-code bands an agent branches on', async () => {
    const result = await executeExagentAsync(projectRoot, ['help', 'workflow']);

    for (const code of ['0', '1', '7', '20', '22']) {
      expect(result.stdout).toContain(`  ${code}   `);
    }
  });

  // The map lives in one screen only [confirmed — Kudo, 2026-08-28: "move this to help workflow"].
  // Two screens that each claim to say what to run first are two screens that will one day
  // disagree, so the topic states the steps and the top level points at the topic.
  it('states the steps, which the top-level screen leaves to it', async () => {
    const topic = await executeExagentAsync(projectRoot, ['help', 'workflow']);

    for (const title of [
      'Check the project',
      'Start the app',
      'Edit and reload',
      "Verify before you're done",
      'Deploy',
      'One-time setup',
    ]) {
      expect(topic.stdout).toContain(title);
    }
  });
});

describe('npx exagent help <command>', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await setupFixtureAsync('go-app');
  });

  // A delegation, not a copy: `help status` runs `status --help`, so there is one help block per
  // command and no second place for it to go stale.
  it('prints that command’s own help, in the template', async () => {
    const viaCommand = await executeExagentAsync(projectRoot, ['help', 'status']);
    const viaFlag = await executeExagentAsync(projectRoot, ['status', '--help']);

    expect(viaCommand.exitCode).toBe(0);
    expect(viaCommand.stdout).toBe(viaFlag.stdout);
    for (const section of ['Usage', 'Options', 'Examples', 'Typically next', 'JSON (--json)']) {
      expect(viaCommand.stdout).toContain(section);
    }
  });

  it('lists the actions of a group, then the options of the action its bare name runs', async () => {
    const result = await executeExagentAsync(projectRoot, ['help', 'skills']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('skills:sync');
    expect(result.stdout).toContain('skills:clean');
    expect(result.stdout).toContain('--dry-run');
  });

  // A name in none of the registry's lists is the same error here as anywhere else: the message,
  // and a `Try:` line that is one hop rather than a search.
  it('fails on a name neither CLI has, with the nearest one', async () => {
    const result = await executeExagentAsync(projectRoot, ['help', 'stauts'], { reject: false });

    expect(result.exitCode).toBe(1);
    expect(result.all).toContain('is not a command');
    expect(result.all).toContain('Try: npx exagent status --help');
  });
});

// @ref llp/0024-cli-ui.rfc.md §Colors are for humans
// The rule a terminal cannot show you: colour is off wherever the output may be parsed. These runs
// are piped, so chalk would already be off — what they pin is that nothing on these paths reaches
// for an escape sequence unconditionally.
describe('colour', () => {
  const ESCAPE = /\[/;

  it('puts no escape sequences in a piped help screen', async () => {
    const projectRoot = await setupFixtureAsync('go-app');

    const result = await executeExagentAsync(projectRoot, ['--help']);

    expect(result.stdout).not.toMatch(ESCAPE);
  });

  it('puts no escape sequences in a --json report, and stdout parses', async () => {
    const projectRoot = await setupFixtureAsync('go-app');

    const result = await executeExagentAsync(projectRoot, ['status', '--json']);

    expect(result.stdout).not.toMatch(ESCAPE);
    expect(() => JSON.parse(result.stdout)).not.toThrow();
  });
});
