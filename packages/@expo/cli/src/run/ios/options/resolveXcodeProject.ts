import fs from 'node:fs/promises';
import path from 'node:path';

import { CommandError } from '../../../utils/errors';
import type { ProjectInfo } from '../XcodeBuild.types';

async function findXcodeProjectPaths(
  projectRoot: string,
  extension: 'xcworkspace' | 'xcodeproj'
): Promise<string[]> {
  return (await Array.fromAsync(fs.glob(`ios/*.${extension}`, { cwd: projectRoot })))
    .map((file) => path.resolve(projectRoot, file))
    .sort((a, b) => b.localeCompare(a, 'en'));
}

/** Return the path and type of Xcode project in the given folder. */
export async function resolveXcodeProject(projectRoot: string): Promise<ProjectInfo> {
  let paths = await findXcodeProjectPaths(projectRoot, 'xcworkspace');
  if (paths.length) {
    return {
      // Use full path instead of relative project root so that warnings and errors contain full paths as well, this helps with filtering.
      // Also helps keep things consistent in monorepos.
      name: paths[0]!,
      // name: path.relative(projectRoot, paths[0]),
      isWorkspace: true,
    };
  }
  paths = await findXcodeProjectPaths(projectRoot, 'xcodeproj');
  if (paths.length) {
    return { name: paths[0]!, isWorkspace: false };
  }
  throw new CommandError(
    'IOS_MALFORMED',
    `Xcode project not found in project: ${projectRoot}. You can generate a project with \`npx expo prebuild\``
  );
}
