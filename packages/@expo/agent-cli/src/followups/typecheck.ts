// @ref llp/0009-smart-followups.rfc.md §Examples per command — `typecheck`.
// The three outcomes need three different next steps: a project that does not type-check has one
// thing worth doing, a clean one has the checks this gate cannot make, and a project with no
// TypeScript in it needs to know that nothing was checked rather than that everything passed.

import { PROGRAM_PREFIX } from '../programName';
import { capFollowUps, type FollowUp } from './types';

export interface TypeCheckFollowUpInput {
  /** Whether a compiler ran at all. */
  checked: boolean;
  /** How many diagnostics it reported. */
  errorCount: number;
  /**
   * The command that generates a declaration file the project expects and does not have.
   *
   * When there is one, it *replaces* the "fix the diagnostics" rung: a brand-new project's first
   * `typecheck` is red because `expo-env.d.ts` has not been generated yet, and telling its caller
   * to fix two files that are both correct is the one next action that cannot work
   * [observed — friction run 7, F64].
   */
  generatedTypesCommand?: string | null;
}

export function buildTypeCheckFollowUps({
  checked,
  errorCount,
  generatedTypesCommand,
}: TypeCheckFollowUpInput): FollowUp[] {
  if (!checked) {
    return capFollowUps([
      {
        id: 'typecheck-not-run',
        command: `${PROGRAM_PREFIX} smoke`,
        why: 'Nothing was type-checked, so this proves nothing about the code: the bundle check inside the smoke gate is what still applies to a project without TypeScript.',
      },
    ]);
  }

  if (errorCount > 0) {
    return capFollowUps([
      ...(generatedTypesCommand
        ? [
            {
              id: 'typecheck-generate-types',
              command: generatedTypesCommand,
              why: 'Some of the diagnostics are about declarations the Expo CLI generates, and the file that carries them does not exist yet. This starts the dev server once, which writes it.',
            },
          ]
        : []),
      {
        id: 'typecheck-rerun',
        command: `${PROGRAM_PREFIX} typecheck`,
        why: generatedTypesCommand
          ? 'Run this again once that file exists: whatever is still reported is about the code.'
          : 'Fix the diagnostics above and run this again — a type error the bundler is happy to compile is one nothing else in this CLI can see.',
      },
    ]);
  }

  return capFollowUps([
    {
      id: 'typecheck-smoke',
      command: `${PROGRAM_PREFIX} smoke`,
      why: 'The types are consistent, which is not the same as the project bundling and running: this builds the entry bundle, opens the app and reports where it stops.',
    },
    {
      id: 'typecheck-runtime-errors',
      command: `${PROGRAM_PREFIX} runtime:errors --fail-on-error`,
      why: 'Types and a bundle both being fine still says nothing about what the running app throws, which is the last of the three.',
    },
  ]);
}
