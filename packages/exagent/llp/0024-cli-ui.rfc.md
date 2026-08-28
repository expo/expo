# 0024: The CLI UI — One Help Template, One On-Ramp, One Palette

**Type:** RFC
**Status:** Draft — implemented
**Systems:** the help template (`src/help/types.ts`, `src/help/format.ts`); the on-ramp (`src/help/howTo.ts`, `src/help/index.ts`); the registry's summaries, workflow map and listing (`src/commandRegistry.ts`); the palette (`src/utils/color.ts`); the launcher (`src/cli.ts`); the follow-up block (`src/followups/format.ts`); the status report (`src/status/format.ts`); the template lint (`src/help/__tests__/template-test.ts`)
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-28
**Related:** [[0006-agent-native-cli-surface]], [[0009-smart-followups]], [[0010-agent-conventions]], [[0001-agentic-cli-on-expo-cli]]

## Summary

The help was confused [confirmed — Kudo, 2026-08-28: "our help feels confused… should find help a
way let agent to know the typical workflow"]. Three problems, one cause.

- **`exagent --help` listed thirty names and never said which one comes first.** A listing answers
  "does a command for this exist". It cannot answer "I have a project and nothing else, what do I
  run", which is the question an agent handed this CLI actually has.
- **Every command's `--help` had a shape of its own**, because every command's author wrote one:
  some had examples, none had a JSON contract, and the rationale was a wall of prose inside the
  option list. `status --help` was 60 lines and `runtime:reload --help` was 110, of which most was
  reasoning that belonged in an LLP.
- **There was no on-ramp.** The exit-code bands, the `--json` contract and the `Try:` convention are
  the same for every command, are what a driving agent has to know before its first command is worth
  running, and were written down only in `llp/0010`, which nobody who installs the CLI has.

The cause is that the help was **prose**, and prose compiles. Nothing checked it, so nothing held it
to a shape.

## The template

One shape for every `npx exagent <command> --help`, in the order a caller needs the answers:

```
  <command> — <one-line summary, from the registry>

  Usage             one $ line
  Options           one entry per flag
  Examples          two to four $ lines, each with what running it gets you
  Typically next    the commands usually run after this one
  JSON (--json)     stdout, stderr, and every top-level key — where --json exists
  Notes             the honest limits and this command's own exit codes

  Learn the loop: npx exagent help how-to
```

The decision that makes it enforceable: a help block is **data**, not a string. `CommandHelp`
(`src/help/types.ts`) is the spec, `renderCommandHelp` is the only thing that decides what a block
looks like, and the registry requires a `help` loader on every entry — so a new command cannot ship
with a `--help` its author invented. `src/help/__tests__/template-test.ts` walks the registry,
loads every spec and asserts:

1. the spec names itself, so a block copied from a neighbour cannot document the neighbour;
2. the usage line is this CLI's own invocation, and `-h, --help` is in the options;
3. there are two to four examples, each starting `npx exagent ` and each saying what it gets you;
4. every `Typically next` name **resolves against the registry**, which is the same check the
   suggested-command lint runs over `Try:` lines ([[0006-agent-native-cli-surface]] §Errors are
   prompts);
5. the JSON block is present **exactly** where the options offer `--json`;
6. the rendered block is at most 60 lines, and `Notes` at most 14.

The two caps are the load-bearing part. `Notes` is the only section with no shape of its own, so it
is where a wall of prose grows back one paragraph at a time; the cap is what sends the rationale to
the how-to and to the LLPs instead.

The examples are checked twice over. The template test checks their shape; the existing
suggested-command sweep (`src/lint/`) already reads every `npx exagent …` string literal in `src/`
and resolves it, so an example naming a renamed command or a flag that no longer exists fails the
lint that was already there. Nothing new was needed for that, which is the argument for writing
examples as literals rather than as a table.

**One summary, one place.** The one-line summary lives on the **registry entry**, not in the
`CommandHelp`: the top-level listing prints it without loading twenty command modules, and the head
of that command's own help prints the same string. The sentence that made a caller pick a command is
the sentence they read when they get there. A unit test caps it at the width of its column, so the
listing stays one line per command.

## The workflow map

`exagent --help` leads with the loop, above the listing:

```
  The loop
    orient   status                what this project is, and what to run next
    run      dev --detach          start the dev server, keep this terminal
             navigate /            open a route in the app on a device
    iterate  runtime:reload        after your edit, run the code on disk
             runtime:errors        what the app threw, over a time window
             runtime:tap <testID>  tap it; --verify says what changed
    gate     smoke                 bundle, type-check and boot, in one go
    ship     deploy                publish the web app to EAS Hosting
    once     new <directory>       create a project
             install <package>     add it at the version this SDK wants
             agents:setup          write AGENTS.md, link the agent skills
```

Six stages, because six is how many decisions there are between an unopened project and a shipped
one. The map is **data** (`workflow` in `src/commandRegistry.ts`) and a unit test resolves every
rung, so a rename cannot leave the map naming a command that no longer exists.

The listing under it keeps its sections but loses its prose: one line per command, the summary in a
column, and at most one short note per section. The Account block used to carry a five-sentence
paragraph about which of two CLIs answers `whoami` where; that sentence is now in
`src/passthrough/auth.ts`, next to the code that decides it. A listing is for finding the command.

## The on-ramp

`npx exagent help how-to` is one screen written for an agent that has never seen this CLI: the loop
as five numbered steps, which commands read and which act, the five exit-code bands and what to do
about each, the `--json` contract including the failure envelope, the `Try:` convention, and the one
command that asks EAS anything. Every help block ends with a pointer to it, and so does the
top-level screen.

It is a **command** rather than only a flag, because `help` is the word somebody types when they
have been handed a CLI and nothing else. `exagent help` prints the top-level screen, `exagent help
how-to` the on-ramp, and `exagent help <command>` that command's own help — by resolving the name
through `resolveCommand` and running the command with `--help`, so there is no second place for a
help block to come from. `--how-to` works on the launcher and on `help` itself.

`help:how-to` is the colon convention applied to a command that takes an argument, and is the first
thing an agent that has learned this CLI's naming types [found by the wave-34 naive-agent walk]. It
is in the absent-capability table with the line that works, because the edit distance to any real
name is far too large for the nearest-match rules to reach it.

The acceptance test for this file is not a unit test. It is a **naive-agent walk**: start a scratch
project and drive the whole loop using only what `exagent -h` and the how-to say. Every place the
walk had to guess is a defect in this text.

## Colors are for humans

A small semantic palette (`src/utils/color.ts`), four roles: section heads, command names, ok, fail,
plus dim for asides. Nothing else gets a colour.

It is **off** in three situations, decided once by the launcher before any command builds a string:

- **`--json`** — a run whose stdout is a JSON object must carry no escape sequence into it, even
  when a person is watching. This is the rule a terminal cannot show you: chalk's own detection says
  "a TTY, colour is fine", and the caller's `JSON.parse` disagrees.
- **not a TTY** — chalk already does this; the launcher states it anyway, because the rule is the
  point and not the library's default.
- **`NO_COLOR`, set and non-empty** — chalk 4's `supports-color` does not implement it [observed —
  `supports-color@7.2.0`, 2026-08-28], and it is the one switch a user has for saying "not here".

The rule the palette exists to keep: **never colour a value an agent parses.** Labels, heads and
command names take colour; the values beside them do not. An agent reads `--json` anyway, where
there is no colour at all.

## `status` reads like the help

The report was already one fact per line, so this is a narrow pass rather than a rewrite, and the
`--json` shape does not move:

- **A detail every platform shares is said once**, under the rows it explains. `EAS was not asked —
  pass --explain` was printed on the ios row and again on the android row, which is the same
  sentence twice on a report whose whole shape is one fact per line. A detail only one platform has
  stays on that platform's row, where it is the thing that tells the two apart.
- **The `Suggested next:` block uses the same three roles** as a help block's `Typically next`, so
  the state-aware one and the static one read as the same kind of thing. They stay different
  sections: one is computed from what just happened ([[0009-smart-followups]]), the other is the
  path most callers take.

## What this does not do

- **It does not version the help.** The `--json` keys are the contract ([[0006]] §Output contract);
  the help text is documentation of it and may be reworded.
- **It does not add `--json` to `help`.** The on-ramp is prose meant to be read; an object wrapping
  it would be the same prose with quotes around it.
- **It does not touch the group listing's shape** beyond the palette and a pointer at the on-ramp. A
  group listing answers "which action", which is a different question from the template's.
