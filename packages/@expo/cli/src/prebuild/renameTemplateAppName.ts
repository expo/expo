import { IOSConfig } from '@expo/config-plugins';
import { glob } from 'fast-glob';
import fs from 'fs';
import path from 'path';

import { ExtractProps } from '../utils/npm';

const debug = require('debug')('expo:prebuild:copyTemplateFiles') as typeof console.log;

function escapeXMLCharacters(original: string): string {
  const noAmps = original.replace('&', '&amp;');
  const noLt = noAmps.replace('<', '&lt;');
  const noGt = noLt.replace('>', '&gt;');
  const noApos = noGt.replace('"', '\\"');
  return noApos.replace("'", "\\'");
}

/**
 * # Background
 *
 * `@expo/cli` and `create-expo` extract a template from a tarball (whether from
 * a local npm project or a GitHub repository), but these templates have a
 * static name that needs to be updated to match whatever app name the user
 * specified.
 *
 * By convention, the app name of all templates is "HelloWorld". During
 * extraction, filepaths are transformed via `createEntryResolver()` in
 * `createFileTransform.ts`, but the contents of files are left untouched.
 * Technically, the contents used to be transformed during extraction as well,
 * but due to poor configurability, we've moved to a post-extraction approach.
 *
 * # The new approach: Renaming the app post-extraction
 *
 * In this new approach, we take a list of file patterns, otherwise known as the
 * "rename config" to determine explicitly which files – relative to the root of
 * the template – to perform find-and-replace on, to update the app name.
 *
 * ## The rename config
 *
 * The rename config can be passed directly as a string array to
 * `getTemplateFilesToRenameAsync()`.
 *
 * The file patterns are formatted as glob expressions to be interpreted by
 * [fast-glob](https://github.com/mrmlnc/fast-glob). Comments are supported with
 * the `#` symbol, both in the plain-text file and string array formats.
 * Whitespace is trimmed and whitespace-only lines are ignored.
 *
 * If no rename config has been passed directly to
 * `getTemplateFilesToRenameAsync()` then this default rename config will be
 * used instead.
 */
export const defaultRenameConfig = [
  // Common
  '!**/node_modules',
  'app.json',

  // Android
  'android/**/*.gradle',
  'android/app/BUCK',
  'android/app/src/**/*.java',
  'android/app/src/**/*.kt',
  'android/app/src/**/*.xml',

  // iOS
  'ios/Podfile',
  'ios/**/*.xcodeproj/project.pbxproj',
  'ios/**/*.xcodeproj/xcshareddata/xcschemes/*.xcscheme',
] as const;

/**
 * Returns a list of files within a template matched by the resolved rename
 * config.
 *
 * The rename config is resolved in the order of preference:
 * Config provided as function param > defaultRenameConfig
 */
export async function getTemplateFilesToRenameAsync({
  cwd,
  /**
   * An array of patterns following the rename config format. If omitted, then
   * we fall back to defaultRenameConfig.
   * @see defaultRenameConfig
   */
  renameConfig: userConfig,
}: Pick<ExtractProps, 'cwd'> & { renameConfig?: string[] }) {
  let config = userConfig ?? defaultRenameConfig;

  // Strip comments, trim whitespace, and remove empty lines.
  config = config.map((line) => line.split(/(?<!\\)#/, 2)[0].trim()).filter((line) => line !== '');

  return await glob(config, {
    cwd,
    // `true` is consistent with .gitignore. Allows `*.xml` to match .xml files
    // in all subdirs.
    baseNameMatch: true,
    dot: true,
    // Prevent climbing out of the template directory in case a template
    // includes a symlink to an external directory.
    followSymbolicLinks: false,
  });
}

export async function renameTemplateAppNameAsync({
  cwd,
  name,
  files,
}: Pick<ExtractProps, 'cwd' | 'name'> & {
  /**
   * An array of files to transform. Usually provided by calling
   * getTemplateFilesToRenameAsync().
   * @see getTemplateFilesToRenameAsync
   */
  files: string[];
}) {
  debug(`Got files to transform: ${JSON.stringify(files)}`);

  await Promise.all(
    files.map(async (file) => {
      const absoluteFilePath = path.resolve(cwd, file);

      let contents: string;
      try {
        contents = await fs.promises.readFile(absoluteFilePath, { encoding: 'utf-8' });
      } catch (error) {
        throw new Error(
          `Failed to read template file: "${absoluteFilePath}". Was it removed mid-operation?`,
          { cause: error }
        );
      }

      debug(`Renaming app name in file: ${absoluteFilePath}`);

      const safeName = ['.xml', '.plist'].includes(path.extname(file))
        ? escapeXMLCharacters(name)
        : name;

      try {
        const replacement = contents
          .replace(/Hello App Display Name/g, safeName)
          .replace(/HelloWorld/g, IOSConfig.XcodeUtils.sanitizedName(safeName))
          .replace(/helloworld/g, IOSConfig.XcodeUtils.sanitizedName(safeName.toLowerCase()));

        if (replacement === contents) {
          return;
        }

        await fs.promises.writeFile(absoluteFilePath, replacement);
      } catch (error) {
        throw new Error(
          `Failed to overwrite template file: "${absoluteFilePath}". Was it removed mid-operation?`,
          { cause: error }
        );
      }
    })
  );
}
