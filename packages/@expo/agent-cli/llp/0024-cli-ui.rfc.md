# 0024: The CLI UI — One Help Template, One On-Ramp, One Palette

**Type:** RFC
**Status:** Final — implemented
**Systems:** the help template (`src/help/types.ts`, `src/help/format.ts`); the on-ramp (`src/help/onRamp.ts`, `src/help/topics.ts`, `src/help/workflow.ts`, `src/help/index.ts`); the registry's summaries, workflow map and listing (`src/commandRegistry.ts`); the palette (`src/utils/color.ts`); the launcher (`src/cli.ts`); the follow-up block (`src/followups/format.ts`); the status report (`src/status/format.ts`); the template lint (`src/help/__tests__/template-test.ts`)
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-28 · finalized 2026-08-28
**Related:** [[0006-agent-native-cli-surface]], [[0009-smart-followups]], [[0010-agent-conventions]], [[0001-agentic-cli-on-expo-cli]]

## Summary

The help was confused [confirmed — Kudo, 2026-08-28: "our help feels confused… should find help a
way let agent to know the typical workflow"]. Three problems, one cause.

- **`@expo/agent-cli --help` listed thirty names and never said which one comes first.** A listing answers
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

One shape for every `npx @expo/agent-cli <command> --help`, in the order a caller needs the answers:

```
  <command> — <one-line summary, from the registry>

  Usage             one $ line
  Options           one entry per flag
  Examples          two to four $ lines, each with what running it gets you
  Typically next    the commands usually run after this one
  JSON (--json)     stdout, stderr, and every top-level key — where --json exists
  Notes             the honest limits and this command's own exit codes

  New here? npx @expo/agent-cli help workflow
```

The decision that makes it enforceable: a help block is **data**, not a string. `CommandHelp`
(`src/help/types.ts`) is the spec, `renderCommandHelp` is the only thing that decides what a block
looks like, and the registry requires a `help` loader on every entry — so a new command cannot ship
with a `--help` its author invented. `src/help/__tests__/template-test.ts` walks the registry,
loads every spec and asserts:

1. the spec names itself, so a block copied from a neighbour cannot document the neighbour;
2. the usage line is this CLI's own invocation, and `-h, --help` is in the options;
3. there are two to four examples, each starting `npx @expo/agent-cli ` and each saying what it gets you;
4. every `Typically next` name **resolves against the registry**, which is the same check the
   suggested-command lint runs over `Try:` lines ([[0006-agent-native-cli-surface]] §Errors are
   prompts);
5. the JSON block is present **exactly** where the options offer `--json`;
6. the rendered block is at most 60 lines, and `Notes` at most 14.

The two caps are the load-bearing part. `Notes` is the only section with no shape of its own, so it
is where a wall of prose grows back one paragraph at a time; the cap is what sends the rationale to
the `workflow` topic and to the LLPs instead.

The examples are checked twice over. The template test checks their shape; the existing
suggested-command sweep (`src/lint/`) already reads every `npx @expo/agent-cli …` string literal in `src/`
and resolves it, so an example naming a renamed command or a flag that no longer exists fails the
lint that was already there. Nothing new was needed for that, which is the argument for writing
examples as literals rather than as a table.

**One summary, one place.** The one-line summary lives on the **registry entry**, not in the
`CommandHelp`: the top-level listing prints it without loading twenty command modules, and the head
of that command's own help prints the same string. The sentence that made a caller pick a command is
the sentence they read when they get there. A unit test caps it at the width of its column, so the
listing stays one line per command.

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

**The titles are plain phrases, never labels.** One-word labels — `orient · run · iterate · gate ·
ship · once` — are a vocabulary a reader has to be taught before the map means anything
[confirmed — Kudo, 2026-08-28: "i'm not clear specifically what they mean"]. The rule the wording is
held to, and the one to apply to anything that joins it: **if a title needs a legend, it is the wrong
title.** The titles are consequently pinned by a unit test — the rule is a judgment rather than a
property, so what a test can offer is putting the rule in front of the next person who rewords one —
alongside a property half that rules out those six words.

The title sits above its commands rather than in a third column, because the titles are sentences
now and three columns of prose does not fit on a terminal. `One-time setup` is a block of its own
rather than a sixth step: a reader following numbers is following a sequence, and "create a project"
does not come after "release".

Five steps, because five is how many there are between an unopened project and a released one. The
map is **data** (`workflow` and `oneTimeSetup` in `src/commandRegistry.ts`) and a unit test resolves
every rung, so a rename cannot leave the map naming a command that no longer exists. The on-ramp
prints the same data with `npx @expo/agent-cli ` in front of it: two screens that each claim to say what to
run first are two screens that will one day disagree.

The listing under it keeps its sections but loses its prose: one line per command, the summary in a
column, and at most one short note per section. Which of two CLIs answers `whoami` where is a
five-sentence explanation, and it lives in `src/passthrough/auth.ts`, next to the code that decides
it, rather than in the Account block. A listing is for finding the command.

## The on-ramp

`npx @expo/agent-cli help workflow` is one screen written for an agent that has never seen this CLI: the
five steps, which commands read and which act, the five exit-code bands and what to do about each,
the `--json` contract including the failure envelope, the `Try:` convention, and the one command
that asks EAS anything. Every help block ends with `New here? npx @expo/agent-cli help workflow`, and so
does the top-level screen.

**A topic is a positional argument, not a flag.** `git help workflows`, `npm help folders`: a topic
is a thing you ask *for*, and asking for it by name is how every CLI a reader already knows spells
it. A flag would have made the on-ramp an option *of* the help command rather than a thing the help
command is *about*, and it would have needed a second flag for every topic that follows. This
replaced a `--how-to` flag that existed for one unpublished day [confirmed — Kudo, 2026-08-28].

**And it is `workflow`, not `how-to`.** A topic is named after what it is *about*; `how-to` names
the genre of the document instead, which tells a reader nothing about whether it is the one they
want.

`help` is a **command**, because that is the word somebody types when they have been handed a CLI
and nothing else. `@expo/agent-cli help` prints the top-level screen, `@expo/agent-cli help <topic>` a topic, and
`@expo/agent-cli help <command>` that command's own help — by resolving the name through `resolveCommand`
and running the command with `--help`, so there is no second place for a help block to come from.
Topics are looked up first, so a command that one day takes a topic's word cannot take its answer.

The mechanism is a list (`src/help/topics.ts`), so `help` stays **one registry entry** however many
topics there come to be, and `@expo/agent-cli help --help` names them without a second list to maintain.
Only `workflow` ships: the exit-code table and the `--json` contract live inside it, where a reader
meets them in the order they need them, and splitting them out before anybody has asked would be
three screens where one is being read. The name itself is one string, `ON_RAMP_TOPIC` in
`src/help/onRamp.ts`, which is a module with no imports so that both the registry and the topic can
read it.

Five spellings that are not the on-ramp are answered with the one that is, through the
absent-capability table: `help:workflow` (the colon convention applied to a positional topic — the
first thing an agent that has learned this CLI's naming types), the bare `workflow`, and
`help:how-to`, `how-to` and `--how-to` from the day the topic had the other name. Edit distance
reaches none of them, so the table is the only thing that can.

The acceptance test for this screen is not a unit test. It is a **naive-agent walk**: start a
scratch project and drive the whole loop using only what `@expo/agent-cli -h` and this topic say. Every
place the walk had to guess is a defect in this text.

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
- **It ships one topic.** The mechanism takes more (`exit-codes`, `json`), and adding one is an
  entry in `helpTopics`. Splitting the on-ramp before anybody has asked would be three screens where
  one is being read.
- **It does not touch the group listing's shape** beyond the palette and a pointer at the on-ramp. A
  group listing answers "which action", which is a different question from the template's.
