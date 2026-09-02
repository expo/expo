// @ref llp/0010-agent-conventions.rfc.md §Needs-human protocol — the port carve-out.
//
// The samples are the three spellings the Expo CLI actually produces, so a wording change upstream
// fails here rather than silently turning a recoverable stop back into "a person must answer this".

import {
  detectPortCollision,
  findFreePortAsync,
  formatPortMove,
  isPortBindableAsync,
  parsePortMove,
} from '../portCollision';

describe(detectPortCollision, () => {
  // What the friction run captured, verbatim: the prompt helper quotes the question it could not
  // ask under `Required input:`.
  it(`reads the question the prompt helper quoted back`, () => {
    const output = [
      'Port 8180 is running node in another window',
      '  /Users/someone/app (pid 4242)',
      "Input is required, but 'npx expo' is in non-interactive mode.",
      'Required input:',
      '> Use port 8181 instead?',
    ].join('\n');

    expect(detectPortCollision(output)).toEqual({ requestedPort: 8180, offeredPort: 8181 });
  });

  it(`reads the line above the question when the question is gone`, () => {
    expect(detectPortCollision('› Port 8081 is being used by another process')).toEqual({
      requestedPort: 8081,
      offeredPort: null,
    });
  });

  // The newer branch of `choosePortAsync`, which throws instead of asking for an explicit port.
  it(`reads the non-interactive refusal of an explicit port`, () => {
    const output = `Port 8180 is unavailable and 'npx expo' is running in non-interactive mode, so it can't prompt to use another port.`;

    expect(detectPortCollision(output)).toEqual({ requestedPort: 8180, offeredPort: null });
  });

  it.each([
    ['nothing at all', ''],
    ['another prompt entirely', "Input is required, but 'npx expo' is in non-interactive mode."],
    ['a build failure that mentions a port', 'Could not connect to http://127.0.0.1:8081'],
  ])(`answers null for %s`, (_name, output) => {
    expect(detectPortCollision(output)).toBeNull();
  });
});

describe(findFreePortAsync, () => {
  it(`answers a port nothing can be bound on`, async () => {
    const port = await findFreePortAsync(49500);

    expect(port).not.toBeNull();
    expect(await isPortBindableAsync(port!)).toBe(true);
  });

  it(`walks past a port that is taken`, async () => {
    const net = require('net') as typeof import('net');
    const server = net.createServer();
    await new Promise<void>((resolve) => server.listen(49321, '127.0.0.1', () => resolve()));

    try {
      expect(await findFreePortAsync(49321)).toBeGreaterThan(49321);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it(`answers null when the whole range it was given is busy`, async () => {
    // A range of zero ports cannot contain a free one, whatever the machine is doing.
    expect(await findFreePortAsync(49400, { range: 0 })).toBeNull();
  });
});

// @ref llp/0004-smart-start-and-project-state.rfc.md §A busy port can
// complete — friction run 5, F48-4. The move is decided in the child process of a `--detach` run
// and read back by the parent, so the sentence is a *protocol* between two processes of this CLI
// rather than only prose. These tests pin both ends of it: the parent's report is wrong the moment
// the two drift, and nothing else would notice.
describe('the port move a detached run reports', () => {
  it(`round-trips a move off a port the Expo CLI named`, () => {
    const line = formatPortMove({ from: 8081, to: 8210 });

    expect(line).toContain('8081');
    expect(line).toContain('8210');
    expect(parsePortMove(line)).toEqual({ from: 8081, to: 8210 });
  });

  // The Expo CLI does not always name the port it wanted, and inventing one would be this CLI
  // claiming a fact it was never told. `to` is the half that is always known.
  it(`round-trips a move whose busy port was never named`, () => {
    const line = formatPortMove({ from: null, to: 8210 });

    expect(line).toContain('8210');
    expect(parsePortMove(line)).toEqual({ from: null, to: 8210 });
  });

  it(`finds the move in a log with the bundler's own output around it`, () => {
    const log = [
      'Starting project at /project',
      formatPortMove({ from: 8081, to: 8210 }),
      'Waiting on http://127.0.0.1:8210',
      'iOS Bundled 220ms',
    ].join('\n');

    expect(parsePortMove(log)).toEqual({ from: 8081, to: 8210 });
  });

  // The reason the parent parses rather than comparing the port it asked for against the port the
  // lock reports: a dev server can land on another port for reasons that are not a collision, and
  // reporting those as a move would be this command inventing a busy port nobody observed.
  it(`answers null for a log with no move in it`, () => {
    expect(parsePortMove('Starting project at /project\niOS Bundled 220ms')).toBeNull();
    expect(parsePortMove('')).toBeNull();
  });
});
