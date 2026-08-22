// @ref llp/0008-guardrails.rfc.md §Summary — Checkpoints
// The two commands of the checkpoint guardrail: take a snapshot, and put one back.
// `create.ts` makes them, `restore.ts` restores them, and `git.ts` documents the mechanism.

import chalk from 'chalk';

import type { Command } from '../types';
import { assertWithOptionsArgs, printHelp } from '../utils/args';

export const exagentCheckpoint: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      // Types
      '--help': Boolean,
      '--json': Boolean,
      '--label': String,
      // Aliases
      '-h': '--help',
    },
    { argv }
  );

  if (args['--help']) {
    printHelp(
      `Snapshot the project, so a later change can be undone`,
      chalk`npx exagent checkpoint`,
      [
        `--label <label>   Why the snapshot exists, printed by "exagent undo --list"`,
        `--json            Print the result as JSON`,
        `-h, --help        Usage info`,
      ].join('\n'),
      [
        '',
        chalk`  A checkpoint is a git snapshot of the files git tracks in this project. It is taken`,
        chalk`  without touching your index, your branches, or {bold HEAD}: nothing is committed, and`,
        chalk`  {bold git status} and {bold git log} do not change.`,
        '',
        chalk`  {bold exagent install}, {bold exagent setup} and {bold exagent start --smart} take one`,
        chalk`  before they change anything. Pass {bold --no-checkpoint}, or set {bold EXAGENT_NO_CHECKPOINT},`,
        chalk`  to turn that off.`,
        '',
        chalk`  Restore the newest one with {bold npx exagent undo}.`,
        '',
      ].join('\n')
    );
  }

  // Load modules after the help prompt so `npx exagent checkpoint -h` shows as fast as possible.
  const { logCmdError } = require('../utils/errors') as typeof import('../utils/errors');
  const { findUpProjectRootOrAssert } =
    require('../utils/findUp') as typeof import('../utils/findUp');
  const { printCheckpointAsync } = require('./create') as typeof import('./create');

  return (async () => {
    const projectRoot = findUpProjectRootOrAssert(process.cwd());
    await printCheckpointAsync(projectRoot, {
      label: args['--label'],
      json: !!args['--json'],
    });
  })().catch(logCmdError);
};

export const exagentUndo: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      // Types
      '--help': Boolean,
      '--json': Boolean,
      '--list': Boolean,
      '--id': String,
      '--no-followups': Boolean,
      // Aliases
      '-h': '--help',
      '-l': '--list',
    },
    { argv }
  );

  if (args['--help']) {
    printHelp(
      `Restore the project to a checkpoint`,
      chalk`npx exagent undo`,
      [
        `--list, -l        List the checkpoints of this project instead of restoring one`,
        `--id <id>         Checkpoint to restore (default: the most recent one)`,
        `--json            Print the result as JSON`,
        `--no-followups    Skip the "Next:" section of suggested follow-up commands`,
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
      ].join('\n')
    );
  }

  // Load modules after the help prompt so `npx exagent undo -h` shows as fast as possible.
  const { logCmdError } = require('../utils/errors') as typeof import('../utils/errors');
  const { findUpProjectRootOrAssert } =
    require('../utils/findUp') as typeof import('../utils/findUp');
  const restore = require('./restore') as typeof import('./restore');

  return (async () => {
    const projectRoot = findUpProjectRootOrAssert(process.cwd());
    if (args['--list']) {
      return await restore.printCheckpointListAsync(projectRoot, { json: !!args['--json'] });
    }
    return await restore.printUndoAsync(projectRoot, {
      id: args['--id'],
      json: !!args['--json'],
      followups: !args['--no-followups'],
    });
  })().catch(logCmdError);
};
