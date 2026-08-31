import { IOSConfig, XML } from '@expo/config-plugins';
import fs from 'fs';
import { glob } from 'glob';
import path from 'path';

import { debugEvent } from './events';

// Android resource XML (strings.xml): aapt2 resolves XML entities before its
// own escape rules, so only &, <, > take entities; the rest (quotes, @, ?,
// whitespace) needs Android's backslash escapes from `escapeAndroidString`.
function escapeAndroidResourceValue(original: string): string {
  const noAmps = original.replace(/&/g, '&amp;');
  const noLt = noAmps.replace(/</g, '&lt;');
  const noGt = noLt.replace(/>/g, '&gt;');
  return XML.escapeAndroidString(noGt);
}

function escapeXMLCharacters(original: string): string {
  const noAmps = original.replace(/&/g, '&amp;');
  const noLt = noAmps.replace(/</g, '&lt;');
  const noGt = noLt.replace(/>/g, '&gt;');
  const noQuots = noGt.replace(/"/g, '&quot;');
  return noQuots.replace(/'/g, '&apos;');
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
 * [glob](https://github.com/isaacs/node-glob). Comments are supported with
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
  'ios/**/*.xcworkspace/contents.xcworkspacedata',

  // macOS
  'macos/Podfile',
  'macos/**/*.xcodeproj/project.pbxproj',
  'macos/**/*.xcodeproj/xcshareddata/xcschemes/*.xcscheme',
  'macos/**/*.xcworkspace/contents.xcworkspacedata',
] as const;

/**
 * Returns a list of files within a template matched by the resolved rename
 * config.
 *
 * The rename config is resolved in the order of preference:
 * Config provided as function param > defaultRenameConfig
 */
export async function getTemplateFilesToRenameAsync(
  cwd: string,
  {
    renameConfig: userConfig,
  }: {
    /**
     * An array of patterns following the rename config format. If omitted, then
     * we fall back to defaultRenameConfig.
     * @see defaultRenameConfig
     */
    renameConfig?: string[];
  } = {}
) {
  let config = userConfig ?? defaultRenameConfig;

  // Strip comments, trim whitespace, and remove empty lines.
  config = config
    .map((line) => line.split(/(?<!\\)#/, 3)[0]?.trim())
    .filter((line): line is string => !!line);

  return await glob(config, {
    cwd,
    // `true` is consistent with .gitignore. Allows `*.xml` to match .xml files
    // in all subdirs.
    matchBase: true,
    dot: true,
    // Prevent climbing out of the template directory in case a template
    // includes a symlink to an external directory.
    follow: false,
    // Do not match on directories, only files
    // Without this patterns like `android/**/*.gradle` actually match the folder `android/.gradle`
    nodir: true,
  });
}

export async function renameTemplateAppNameAsync(
  cwd: string,
  {
    expName: name,
    files,
  }: {
    expName: string;
    /**
     * An array of files to transform. Usually provided by calling
     * getTemplateFilesToRenameAsync().
     * @see getTemplateFilesToRenameAsync
     */
    files: string[];
  }
) {
  debugEvent('rename_files', { count: files.length });

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

      debugEvent('rename_file', { path: debugEvent.path(absoluteFilePath) });

      const extension = path.extname(file);
      // Escaping applies only to the display name; the sanitized project
      // identifiers derive from the raw name so they match across all files.
      // `.xml` files in the rename config are Android resources; `.plist` is
      // generic XML.
      // Under `expo prebuild`, `AndroidConfig.Name.withName` later overwrites
      // `app_name` from the raw config name, escaped by the same
      // `escapeAndroidString`. This escaping keeps the file valid until the
      // mods run, and is the final output for custom rename configs and for
      // `create-expo`, which runs no mods.
      const safeName =
        extension === '.xml'
          ? escapeAndroidResourceValue(name)
          : extension === '.plist'
            ? escapeXMLCharacters(name)
            : name;

      try {
        const replacement = contents
          .replace(/Hello App Display Name/g, () => safeName)
          .replace(/HelloWorld/g, IOSConfig.XcodeUtils.sanitizedName(name))
          .replace(/helloworld/g, IOSConfig.XcodeUtils.sanitizedName(name).toLowerCase());

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
