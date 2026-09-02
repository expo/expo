// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0008
//
// @ref llp/0009-smart-followups.rfc.md §The follow-up block
// @ref llp/0017-deferred-commands.reference.md §The checkpoint system
// What an undo leaves to do. A checkpoint only ever restores files git tracks, so what it cannot
// put back is everything derived from them: `node_modules` and the installed app.

import { capFollowUps, type FollowUp } from '../../followups/types';
import { PROGRAM_PREFIX } from '../../programName';

export interface UndoFollowUpInput {
  /** Project-relative paths the restore wrote. */
  paths: string[];
}

/** Files whose restored contents mean the installed app no longer matches the project. */
const NATIVE_PATH_PATTERN = /(^|\/)(ios|android)\/|(^|\/)app\.(json|config\.(js|ts|mjs|cjs))$/;

/**
 * What to do after an undo: reinstall the dependencies the restored manifest names, and rebuild
 * the app when the restore changed the native surface.
 *
 * `npm install` is the suggestion, not the project's own package manager: the restore cannot know
 * which one is in use, and `install-dependencies` is the id an agent branches on.
 */
export function buildUndoFollowUps({ paths }: UndoFollowUpInput): FollowUp[] {
  const followups: FollowUp[] = [];

  if (paths.some((filePath) => filePath === 'package.json' || filePath.endsWith('/package.json'))) {
    followups.push({
      id: 'install-dependencies',
      command: 'npm install',
      why: 'package.json was restored, so node_modules can still hold the dependencies of the version that was undone.',
    });
  }

  if (paths.some((filePath) => NATIVE_PATH_PATTERN.test(filePath))) {
    followups.push({
      id: 'dev',
      command: `${PROGRAM_PREFIX} dev`,
      why: 'Native project files were restored, so the app that is installed may no longer match the project: this plans and makes the build that does.',
    });
  }

  return capFollowUps(followups);
}
