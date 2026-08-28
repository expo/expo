// @ref llp/0024-cli-ui.rfc.md §Colors are for humans
// The three situations in which this CLI prints no escape sequence at all.
//
// The rule that matters is the `--json` one, and it is the one a terminal cannot show you: a
// person running `exagent status --json` in a real terminal has a TTY, so chalk's own detection
// says "colour is fine" — and an escape sequence inside a JSON object breaks the parse of a run
// that was otherwise complete. So the launcher decides, once, before any command builds a string.

import chalk from 'chalk';

import { configureColor, noColorRequested } from '../color';

describe(noColorRequested, () => {
  it('reads NO_COLOR as set-and-non-empty, per the convention', () => {
    expect(noColorRequested({ NO_COLOR: '1' })).toBe(true);
    expect(noColorRequested({ NO_COLOR: 'anything' })).toBe(true);
    // An empty value states nothing, so it is not an answer.
    expect(noColorRequested({ NO_COLOR: '' })).toBe(false);
    expect(noColorRequested({})).toBe(false);
  });
});

describe(configureColor, () => {
  let level: typeof chalk.level;

  beforeEach(() => {
    level = chalk.level;
    // Start from "this terminal can colour", so a rule below is what turns it off.
    chalk.level = 3;
  });

  afterEach(() => {
    chalk.level = level;
    delete process.env.NO_COLOR;
  });

  it('leaves colour on for a plain run in a terminal', () => {
    configureColor({ json: false, isTty: true });

    expect(chalk.level).toBe(3);
  });

  it('turns colour off for a --json run, even in a terminal', () => {
    configureColor({ json: true, isTty: true });

    expect(chalk.level).toBe(0);
  });

  it('turns colour off when stdout is not a terminal', () => {
    configureColor({ json: false, isTty: false });

    expect(chalk.level).toBe(0);
  });

  it('turns colour off when NO_COLOR is set', () => {
    process.env.NO_COLOR = '1';

    configureColor({ json: false, isTty: true });

    expect(chalk.level).toBe(0);
  });
});
