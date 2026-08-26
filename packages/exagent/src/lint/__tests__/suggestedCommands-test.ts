// @ref llp/0006-agent-native-cli-surface.rfc.md §Errors are prompts
// The lint itself: every command this CLI prints, checked against the CLI.

import path from "path";

import { formatMentionProblems } from "../checkCommandMentions";
import { sweepSuggestedCommands, type Sweep } from "../sweep";

// The subject of this suite is the repository itself, so it reads the real one: the suite-wide
// `fs` mock is memfs, which has none of these files in it.
jest.unmock("fs");
jest.unmock("node:fs");

const SRC = path.resolve(__dirname, "../..");

let sweep: Sweep;
beforeAll(() => {
  sweep = sweepSuggestedCommands(SRC);
});

describe("the suggested-command sweep", () => {
  it(`reads the whole command-printing surface`, () => {
    // A floor, not an exact count: the point of the sweep is that it is over the source rather than
    // over a registry, so it grows with the CLI. A number that collapses is the failure to catch —
    // an extractor that stopped matching would otherwise report "no problems".
    expect(sweep.files.length).toBeGreaterThan(150);
    expect(sweep.summary.total).toBeGreaterThan(300);
    expect(sweep.summary.resolved).toBeGreaterThan(250);
    expect(sweep.summary.optionsChecked).toBeGreaterThan(250);
    expect(sweep.summary.suggestions).toBeGreaterThan(150);
  });

  it(`reads the README, which documents the same commands and rots the same way`, () => {
    expect(sweep.files).toContain("README.md");
    expect(sweep.mentions.some((mention) => mention.file === "README.md")).toBe(
      true
    );
  });

  it(`finds the commands of every group, so no part of the surface is invisible to it`, () => {
    const named = new Set(sweep.mentions.map((mention) => mention.command));
    for (const command of [
      "dev",
      "dev:wait",
      "dev:stop",
      "dev:logs",
      "status",
      "typecheck",
      "smoke",
      "navigate",
      "doctor",
      "runtime:errors",
      "runtime:reload",
      "skills:list",
      "checkpoint:list",
      "build:explain",
      "build:wait",
      "config:effective",
      "agents:setup",
      "deploy",
    ]) {
      expect(named).toContain(command);
    }
  });
});

describe("every command this CLI tells a caller to run", () => {
  it(`resolves, takes the options it is given, and is runnable as printed`, () => {
    // The message is the deliverable: a failure here has to say which file, which line, which
    // string, and what about it is wrong, or the next person answers it by deleting the assertion.
    expect(
      sweep.problems.length === 0 ? "" : formatMentionProblems(sweep.problems)
    ).toBe("");
  });
});

describe("the option lists the sweep checks against", () => {
  it(`covers the commands whose parse names itself`, () => {
    const covered = [...sweep.flagSpecs.keys()].sort();
    expect(covered).toMatchInlineSnapshot(`
      [
        "agents:setup",
        "build:explain",
        "build:wait",
        "checkpoint",
        "checkpoint:create",
        "checkpoint:list",
        "checkpoint:undo",
        "config:effective",
        "deploy",
        "dev",
        "dev:logs",
        "dev:run",
        "dev:stop",
        "dev:wait",
        "doctor:check",
        "doctor:fix",
        "install",
        "navigate",
        "new",
        "runtime",
        "runtime:errors",
        "runtime:eval",
        "runtime:network",
        "runtime:reload",
        "runtime:stop",
        "skills",
        "skills:clean",
        "skills:list",
        "skills:show",
        "skills:sync",
        "smoke",
        "start",
        "status",
        "typecheck",
      ]
    `);
  });

  it(`names the parses whose command is computed, so the hole is a list and not a silence`, () => {
    // A parse call whose command name is built at runtime cannot be attributed to a command, so the
    // options of that command are unchecked. Pinned rather than tolerated: a *new* one has to be
    // added here on purpose, which is when somebody decides whether it is worth making readable.
    expect(
      sweep.unreadableParses.map(
        ({ file, line, nameExpression }) => `${file}:${line} ${nameExpression}`
      )
    ).toMatchInlineSnapshot(`[]`);
  });
});
