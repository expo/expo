// @ref llp/0006-agent-native-cli-surface.rfc.md §Surface improvements
// One managed block inside a file the user owns. Everything outside the two markers is the
// user's, and is preserved byte for byte, so a rerun is safe at any time.
import fs from 'fs';
import path from 'path';

import { CommandError } from '../utils/errors';
import type { AgentsMdResult } from './types';

/** The file the block is maintained in, relative to the project root. */
export const AGENTS_MD_FILE = 'AGENTS.md';

export const BLOCK_START = '<!-- BEGIN EXPO AGENT CLI MANAGED BLOCK -->';
export const BLOCK_END = '<!-- END EXPO AGENT CLI MANAGED BLOCK -->';

/**
 * Return the contents of `AGENTS.md` with the managed block set to `blockBody`.
 *
 * Pure, so the byte-for-byte guarantee is testable without a file system: the lines outside the
 * markers are never rebuilt, only spliced around.
 */
export function applyManagedBlock(contents: string | null, blockBody: string): string {
  const blockLines = [BLOCK_START, ...blockBody.replace(/\n+$/, '').split('\n'), BLOCK_END];

  if (!contents?.length) {
    return blockLines.join('\n') + '\n';
  }

  const lines = contents.split('\n');
  const start = lines.indexOf(BLOCK_START);

  if (start >= 0) {
    const end = lines.indexOf(BLOCK_END, start);
    if (end < 0) {
      throw new CommandError(
        'AGENTS_MD_UNCLOSED_BLOCK',
        `${AGENTS_MD_FILE} has a "${BLOCK_START}" marker without a matching "${BLOCK_END}" marker, so the managed block has no end and rewriting it would delete the rest of the file. Add the end marker back, or delete the start marker to let the block be appended again, then run the command again.`
      );
    }
    const next = [...lines];
    next.splice(start, end - start + 1, ...blockLines);
    return withTrailingNewline(next.join('\n'));
  }

  // No block yet: append it after the user's content, separated by one blank line.
  const next = [...lines];
  while (next.at(-1) === '') {
    next.pop();
  }
  next.push('', ...blockLines);
  return withTrailingNewline(next.join('\n'));
}

/**
 * Write the managed block into the project's `AGENTS.md`, creating the file when it is missing.
 *
 * A file that already holds this exact block is left untouched, so the report can say `skipped`
 * and a rerun never shows up in `git status`.
 */
export async function writeManagedBlockAsync(
  projectRoot: string,
  blockBody: string
): Promise<AgentsMdResult> {
  const filePath = path.join(projectRoot, AGENTS_MD_FILE);
  // `writeFile` follows a symlink, so a link committed by the project would aim this write at
  // whatever it points at — a shell profile, an SSH `authorized_keys`, a global agent config.
  // The block also carries project-supplied text, so the content is not ours either.
  const stats = await fs.promises.lstat(filePath).catch(() => null);
  if (stats?.isSymbolicLink()) {
    throw new CommandError(
      'AGENTS_MD_SYMLINK',
      `${AGENTS_MD_FILE} is a symlink, so writing the managed block would edit the file it points at rather than a file in this project. Replace it with a regular file, or delete it, then run the command again.`
    );
  }

  const contents = await fs.promises.readFile(filePath, 'utf8').catch(() => null);
  const next = applyManagedBlock(contents, blockBody);

  if (next === contents) {
    return { path: AGENTS_MD_FILE, action: 'skipped' };
  }

  await fs.promises.writeFile(filePath, next);
  return { path: AGENTS_MD_FILE, action: contents == null ? 'created' : 'updated' };
}

/**
 * Note a `CLAUDE.md` that never points at `AGENTS.md`.
 *
 * `@expo/agent-cli` maintains one file only: writing into a second agent instruction file would edit
 * content nobody asked it to own. An agent that reads `CLAUDE.md` alone would then miss the
 * block, so say so instead of fixing it silently. Returns null when there is nothing to say.
 */
export async function checkClaudeMdReferenceAsync(projectRoot: string): Promise<string | null> {
  const claudeMdPath = path.join(projectRoot, 'CLAUDE.md');
  const stats = await fs.promises.lstat(claudeMdPath).catch(() => null);
  if (stats == null) {
    return null;
  }

  // A symlink to AGENTS.md is the same file, so the block is already there.
  if (stats.isSymbolicLink()) {
    const [claudeMdTarget, agentsMdTarget] = await Promise.all([
      fs.promises.realpath(claudeMdPath).catch(() => null),
      fs.promises.realpath(path.join(projectRoot, AGENTS_MD_FILE)).catch(() => null),
    ]);
    if (claudeMdTarget != null && claudeMdTarget === agentsMdTarget) {
      return null;
    }
  }

  const contents = await fs.promises.readFile(claudeMdPath, 'utf8').catch(() => null);
  if (contents?.includes(AGENTS_MD_FILE)) {
    return null;
  }

  return `CLAUDE.md exists and does not mention ${AGENTS_MD_FILE}. This command never writes CLAUDE.md, so add a line like "See ${AGENTS_MD_FILE}." to it, or make it a symlink to ${AGENTS_MD_FILE}, for agents that read CLAUDE.md only.`;
}

function withTrailingNewline(contents: string): string {
  return contents.endsWith('\n') ? contents : contents + '\n';
}
