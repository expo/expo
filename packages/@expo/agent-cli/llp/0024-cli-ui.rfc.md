# 0024: The CLI UI

**Type:** RFC
**Status:** Active
**Systems:** the help template (`src/help/types.ts`, `src/help/format.ts`); the on-ramp (`src/help/onRamp.ts`, `src/help/topics.ts`, `src/help/workflow.ts`, `src/help/index.ts`); the registry's summaries, workflow map and listing (`src/commandRegistry.ts`); the palette (`src/utils/color.ts`); the program's own name (`src/programName.ts`); the launcher (`src/cli.ts`); the follow-up block (`src/followups/format.ts`); the status report (`src/status/format.ts`); the template lint (`src/help/__tests__/template-test.ts`)
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-28
**Revised:** 2026-08-30
**Related:** [[0006-agent-native-cli-surface]], [[0009-smart-followups]], [[0010-agent-conventions]], [[0001-agentic-cli-on-expo-cli]]

## Summary

Three problems, one cause. `@expo/agent-cli --help` listed thirty names and never said which one comes first. Every command's `--help` had a shape of its own. There was no on-ramp for the exit-code bands, the `--json` contract, and the `Try:` convention. The cause is that the help was prose, and prose compiles. Nothing checked it, so nothing held it to a shape.

## The template

One shape for every `npx @expo/agent-cli <command> --help`, in the order a caller needs the answers:

```
  <command>, <one-line summary, from the registry>

  Usage             one $ line
  Options           one entry per flag
  Examples          two to four $ lines, each with what running it gets you
  Typically next    the commands usually run after this one
  JSON (--json)     stdout, stderr, and every top-level key, where --json exists
  Notes             the honest limits and this command's own exit codes

  New here? npx @expo/agent-cli help workflow
```

A help block is data, not a string. `CommandHelp` (`src/help/types.ts`) is the spec. `renderCommandHelp` is the only thing that decides what a block looks like. The registry requires a `help` loader on every entry, so a new command cannot ship with a `--help` its author invented. `src/help/__tests__/template-test.ts` walks the registry, loads every spec, and asserts:

1. the spec names itself, so a block copied from a neighbour cannot document the neighbour;
2. the usage line is this CLI's own invocation, and `-h, --help` is in the options;
3. there are two to four examples, each starting `npx @expo/agent-cli ` and each saying what it gets you;
4. every `Typically next` name resolves against the registry, the same check the suggested-command lint runs over `Try:` lines;
5. the JSON block is present exactly where the options offer `--json`;
6. the rendered block is at most 60 lines, and `Notes` at most 14.

The two caps are the load-bearing part. `Notes` is the only section with no shape of its own, so it is where a wall of prose grows back. The cap is what sends the rationale to the `workflow` topic and to the LLPs instead.

The keys a help block names are every key the `--json` object has ([[0006-agent-native-cli-surface]] §Output contract).

The examples are also checked by the existing suggested-command sweep (`src/lint/`), which reads every `npx @expo/agent-cli …` string literal in `src/` and resolves it. Write examples as literals rather than as a table.

One summary, one place. The one-line summary lives on the registry entry, not in the `CommandHelp`. The top-level listing prints it without loading twenty command modules, and the head of that command's own help prints the same string. A unit test caps it at the width of its column.

## The workflow map

`@expo/agent-cli --help` leads with what to run, above the listing:

```
  What to run, in order
    1  Check the project
         status                what this project is, and what to run next
    2  Start the app
         dev --detach          start the dev server, keep this terminal
         navigate /            open a route in the app on a device
    3  Edit and reload
         runtime:reload        after your edit, run the code on disk
         runtime:errors        what the app threw, over a time window
         runtime:tree          what is on screen, and its testIDs
         runtime:tap <testID>  tap it; --verify says what changed
    4  Verify before you're done
         smoke                 bundle, boot and error window, one exit code
         typecheck             the type errors neither of those can see
         doctor                what expo-doctor finds wrong with the setup
    5  Release
         deploy                publish the web app to EAS Hosting

       One-time setup
         new <directory>       create a project
         install <package>     add it at the version this SDK wants
         agents:setup          write AGENTS.md, link the agent skills
```

The titles are plain phrases, never labels. If a title needs a legend, it is the wrong title. The titles are pinned by a unit test. The title sits above its commands rather than in a third column. `One-time setup` is a block of its own rather than a sixth step: a reader following numbers is following a sequence, and "create a project" does not come after "release".

The map is data (`workflow` and `oneTimeSetup` in `src/commandRegistry.ts`). A unit test resolves every rung, so a rename cannot leave the map naming a command that no longer exists. The on-ramp prints the same data with `npx @expo/agent-cli ` in front of it.

The listing under it keeps its sections but loses its prose: one line per command, the summary in a column, and at most one short note per section. A listing is for finding the command.

## The on-ramp

`npx @expo/agent-cli help workflow` is one screen written for an agent that has never seen this CLI: the five steps, which commands read and which act, the five exit-code bands and what to do about each, the `--json` contract including the failure envelope, the `Try:` convention, and the one command that asks EAS anything. Every help block ends with `New here? npx @expo/agent-cli help workflow`, and so does the top-level screen.

A topic is a positional argument, not a flag. `git help workflows`, `npm help folders`: a topic is a thing you ask for. It is `workflow`, not `how-to`. A topic is named after what it is about.

`help` is a command. `@expo/agent-cli help` prints the top-level screen, `@expo/agent-cli help <topic>` a topic, and `@expo/agent-cli help <command>` that command's own help, by resolving the name through `resolveCommand` and running the command with `--help`. There is no second place for a help block to come from. Topics are looked up first, so a command that one day takes a topic's word cannot take its answer.

The mechanism is a list (`src/help/topics.ts`), so `help` stays one registry entry however many topics there come to be. Only `workflow` ships. The name itself is one string, `ON_RAMP_TOPIC` in `src/help/onRamp.ts`.

Five spellings that are not the on-ramp are answered with the one that is, through the absent-capability table: `help:workflow`, the bare `workflow`, and `help:how-to`, `how-to`, and `--how-to`.

## Colors are for humans

A small semantic palette (`src/utils/color.ts`), four roles: section heads, command names, ok, fail, plus dim for asides. Nothing else gets a colour.

It is off in three situations, decided once by the launcher before any command builds a string:

- `--json`. A run whose stdout is a JSON object must carry no escape sequence into it, even when a person is watching. Chalk's own detection says "a TTY, colour is fine". The caller's `JSON.parse` disagrees.
- Not a TTY. Chalk already does this. The launcher states it anyway, because the rule is the point and not the library's default.
- `NO_COLOR`, set and non-empty. Chalk 4's `supports-color` does not implement it, and it is the one switch a user has for saying "not here".

Never colour a value an agent parses. Labels, heads, and command names take colour. The values beside them do not. An agent reads `--json` anyway, where there is no colour at all.

The `status` report uses the same three roles as a help block's `Typically next` for its `Suggested next:` block. They stay different sections: one is computed from what just happened ([[0009-smart-followups]]), the other is the path most callers take. A detail every platform shares is said once, under the rows it explains.

## The program names itself

Program output never hardcodes the program's name. A line that names this CLI reads it from `package.json`, through `src/programName.ts`, at runtime. [confirmed, Kudo, 2026-08-29]

Two constants, because output needs two forms:

- `PROGRAM_NAME`: the name on its own, for a sentence about the program.
- `PROGRAM_PREFIX`: `npx <name>`, the head of every line the reader is meant to run. `npx` rather than the declared bin, because that is what works without an install.

At runtime, not at build time. `import { name } from '../package.json'` is inlined by ncc, so the bundle would answer with whatever the build machine was called, and every in-process test would still pass. The resolution is a walk up from the module's own directory to the nearest `package.json` that has a `name`. An unreadable installation falls back to the published name and says nothing: help that crashes over its own banner is worse than help that prints a stale name.

The acceptance test copies the built package out of the tree, edits `name` in the copy's `package.json` after the build, and asserts that `-h`, one command's help, the workflow topic, and a failing command's `Try:` line all carry the new name. (`e2e/__tests__/program-name-test.ts`)

What does not follow the name, and why each one is a constant instead:

- Follow-up ids and JSONL event names. These are keys a driving agent branches on, a contract per [[0006-agent-native-cli-surface]] §Output contract.
- The files under `.expo/` and the `AGENTS.md` block markers. They are read by the next run, which may be a different version. A rename would orphan the record rather than migrate it.
- The git identity of a snapshot commit (`expo-agent-cli`). One tool is one author across a project's history.
- The declared `bin` name. It exists because `npx <package>` needs a declared bin, and it is named in no help text ([[0001-agentic-cli-on-expo-cli]] §Naming).

The suggested-command lint reads the same module. `src/lint/commandMentions.ts` substitutes the two known interpolations back to the values the CLI will print.

## What this does not do

- It does not version the help. The `--json` keys are the contract. The help text is documentation of it and may be reworded.
- It does not add `--json` to `help`. The on-ramp is prose meant to be read.
- It ships one topic. The mechanism takes more. Splitting the on-ramp before anybody has asked would be three screens where one is being read.
- It does not touch the group listing's shape beyond the palette and a pointer at the on-ramp.
