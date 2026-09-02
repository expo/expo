// @ref llp/0007-deploy-and-headless.rfc.md §new
// How `@expo/agent-cli new` reaches `create-expo`: as a subprocess, never as an import (llp/0001
// constraint 5), and with the arguments that make it answer its own prompts.

import { resolvePackageRunner } from '../utils/packageRunner';
import { findExecutableOnPath } from '../utils/subprocess';

/** The `create-expo` invocation to spawn. */
export interface CreateExpoCli {
  /** Executable to spawn. */
  command: string;
  /** Arguments that name the CLI, before the ones for the project. Empty for a resolved bin. */
  args: string[];
}

/**
 * Resolve the `create-expo` CLI to run.
 *
 * A `create-expo` on `PATH` wins, so a machine (or a test) can pin the version that runs;
 * otherwise the npm registry provides it, which is how the tool is normally used and needs no
 * install step of its own.
 *
 * @param pathEnv `PATH` to search, for tests that must not depend on the machine's own.
 */
export function resolveCreateExpoCli({ pathEnv }: { pathEnv?: string } = {}): CreateExpoCli {
  const localBin = findExecutableOnPath('create-expo', { pathEnv });
  if (localBin) {
    return { command: localBin, args: [] };
  }
  const { command } = resolvePackageRunner({ pathEnv });
  return { command, args: ['create-expo@latest'] };
}

/**
 * The `create-expo` arguments for one headless creation.
 *
 * `--yes` is not optional here: without it `create-expo` asks which template and which SDK version
 * to use, and `@expo/agent-cli new` runs with no stdin at all (llp/0006 §Surface improvements), so a
 * prompt would be an EOF failure instead of a project.
 *
 * The directory is passed exactly as typed. `create-expo` derives the app name and the slug from
 * its basename, and a rewritten path would silently rename the app.
 */
export function buildCreateExpoArgs(
  directory: string,
  { install }: { install: boolean }
): string[] {
  const args = [directory, '--yes'];
  if (!install) {
    args.push('--no-install');
  }
  return args;
}
