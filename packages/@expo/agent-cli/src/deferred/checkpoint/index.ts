// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0008
//
// @ref llp/0017-deferred-commands.reference.md §The checkpoint system
// The three commands of the checkpoint guardrail: take a snapshot, list them, and put one back.
// `create.ts` makes them, `restore.ts` restores them, and `git.ts` documents the mechanism.

import chalk from 'chalk';

import { PROGRAM_NAME, PROGRAM_PREFIX } from '../../programName';
import type { Command } from '../../types';
import { assertWithOptionsArgs, printHelp } from '../../utils/args';

export const agentCliCheckpointCreate: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      // Types
      '--help': Boolean,
      '--json': Boolean,
      '--label': String,
      // Aliases
      '-h': '--help',
    },
    { argv, command: 'checkpoint', positionalArgs: 'none' }
  );

  if (args['--help']) {
    printHelp(
      `Snapshot the project, so a later change can be undone`,
      chalk`${PROGRAM_PREFIX} checkpoint`,
      [
        `--label <label>   Why the snapshot exists, printed by "${PROGRAM_NAME} checkpoint:list"`,
        `--json            Print the result as JSON`,
        `-h, --help        Usage info`,
      ].join('\n'),
      [
        '',
        chalk`  A checkpoint is a git snapshot of the files git tracks in this project. It is taken`,
        chalk`  without touching your index, your branches, or {bold HEAD}: nothing is committed, and`,
        chalk`  {bold git status} and {bold git log} do not change.`,
        '',
        chalk`  {bold ${PROGRAM_NAME} install}, {bold ${PROGRAM_NAME} agents:setup} and {bold ${PROGRAM_NAME} dev} take one`,
        chalk`  before they change anything. Pass {bold --no-checkpoint}, or set {bold AGENT_CLI_NO_CHECKPOINT},`,
        chalk`  to turn that off.`,
        '',
        chalk`  Restore the newest one with {bold ${PROGRAM_PREFIX} checkpoint:undo}, and see the recorded ones`,
        chalk`  with {bold ${PROGRAM_PREFIX} checkpoint:list}.`,
        '',
      ].join('\n')
    );
  }

  // Load modules after the help prompt so `npx @expo/agent-cli checkpoint -h` shows as fast as possible.
  const { logCmdError } = require('../../utils/errors') as typeof import('../../utils/errors');
  const { findUpProjectRootOrAssert } =
    require('../../utils/findUp') as typeof import('../../utils/findUp');
  const { printCheckpointAsync } = require('./create') as typeof import('./create');

  return (async () => {
    const projectRoot = findUpProjectRootOrAssert(process.cwd());
    await printCheckpointAsync(projectRoot, {
      label: args['--label'],
      json: !!args['--json'],
    });
  })().catch(logCmdError);
};

export const agentCliCheckpointList: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      // Types
      '--help': Boolean,
      '--json': Boolean,
      // Aliases
      '-h': '--help',
    },
    { argv, command: 'checkpoint:list', positionalArgs: 'none' }
  );

  if (args['--help']) {
    printHelp(
      `List the checkpoints recorded for this project`,
      chalk`${PROGRAM_PREFIX} checkpoint:list`,
      [`--json            Print the result as JSON`, `-h, --help        Usage info`].join('\n'),
      [
        '',
        chalk`  Reads the record in {bold .expo/agent-cli-checkpoints.json} only: it answers in a project`,
        chalk`  whose repository is gone, and never spawns git. One line per checkpoint, newest first,`,
        chalk`  with the id {bold ${PROGRAM_PREFIX} checkpoint:undo --id <id>} takes.`,
        '',
      ].join('\n')
    );
  }

  // Load modules after the help prompt so `npx @expo/agent-cli checkpoint:list -h` shows as fast as possible.
  const { logCmdError } = require('../../utils/errors') as typeof import('../../utils/errors');
  const { findUpProjectRootOrAssert } =
    require('../../utils/findUp') as typeof import('../../utils/findUp');
  const restore = require('./restore') as typeof import('./restore');

  return (async () => {
    const projectRoot = findUpProjectRootOrAssert(process.cwd());
    await restore.printCheckpointListAsync(projectRoot, { json: !!args['--json'] });
  })().catch(logCmdError);
};

export const agentCliCheckpointUndo: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      // Types
      '--help': Boolean,
      '--json': Boolean,
      '--id': String,
      '--no-followups': Boolean,
      // Aliases
      '-h': '--help',
    },
    {
      argv,
      command: 'checkpoint:undo',
      positionalArgs: 'none',
      // The one destructive command in the set, and the one an agent guesses the argument of:
      // `checkpoint:list` prints ids, so `checkpoint:undo <id>` is the natural next line to type.
      strayHint:
        `name the checkpoint with --id, as "${PROGRAM_PREFIX} checkpoint:undo --id ` +
        `<id>", or run "${PROGRAM_PREFIX} checkpoint:list" for the ids. With no --id this command ` +
        'restores the most recent checkpoint over your working tree, which is what a dropped ' +
        'argument would have done here.',
    }
  );

  if (args['--help']) {
    printHelp(
      `Restore the project to a checkpoint`,
      chalk`${PROGRAM_PREFIX} checkpoint:undo`,
      [
        `--id <id>         Checkpoint to restore (default: the most recent one)`,
        `--json            Print the result as JSON`,
        `--no-followups    Skip the "Suggested next:" section of suggested follow-up commands`,
        `-h, --help        Usage info`,
      ].join('\n'),
      [
        '',
        chalk`  Puts back every file the checkpoint holds. Files created since the checkpoint are`,
        chalk`  {bold kept}: an undo only ever writes files, it never deletes one. Your branches, {bold HEAD},`,
        chalk`  and your index are untouched, so the restore shows up as ordinary working-tree changes.`,
        '',
        chalk`  Files git ignores — {bold node_modules}, {bold ios/Pods}, {bold .env} — are in no checkpoint,`,
        chalk`  so a restored {bold package.json} needs an install afterwards.`,
        '',
        chalk`  The recorded checkpoints and their ids are listed by {bold ${PROGRAM_PREFIX} checkpoint:list}.`,
        '',
      ].join('\n')
    );
  }

  // Load modules after the help prompt so `npx @expo/agent-cli checkpoint:undo -h` shows as fast as possible.
  const { logCmdError } = require('../../utils/errors') as typeof import('../../utils/errors');
  const { findUpProjectRootOrAssert } =
    require('../../utils/findUp') as typeof import('../../utils/findUp');
  const restore = require('./restore') as typeof import('./restore');

  return (async () => {
    const projectRoot = findUpProjectRootOrAssert(process.cwd());
    await restore.printUndoAsync(projectRoot, {
      id: args['--id'],
      json: !!args['--json'],
      followups: !args['--no-followups'],
    });
  })().catch(logCmdError);
};
