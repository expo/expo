// @ref llp/0007-deploy-and-headless.rfc.md §new
// `--name` is the one thing about the new app that the directory cannot say: `create-expo` names
// the app after the directory, and a directory is a path, not a product name.

import fs from 'fs';
import path from 'path';

/**
 * Write the display name of a freshly created project into its `app.json`.
 *
 * Only `expo.name` changes. `expo.slug` identifies the project to EAS and the directory already
 * named it, so renaming the slug here would point a later `eas` command at a different project.
 *
 * The file is only ever the one `create-expo` just wrote, which is why an in-place rewrite is safe
 * at this point and nowhere else.
 *
 * @returns whether the name was written. `false` for a project whose config is code
 * (`app.config.js`), which this command does not rewrite.
 */
export async function applyAppNameAsync(projectRoot: string, name: string): Promise<boolean> {
  const configPath = path.join(projectRoot, 'app.json');

  let config: { expo?: { name?: string } };
  try {
    config = JSON.parse(await fs.promises.readFile(configPath, 'utf8'));
  } catch {
    return false;
  }

  if (!config.expo || typeof config.expo !== 'object') {
    return false;
  }

  config.expo.name = name;
  await fs.promises.writeFile(configPath, JSON.stringify(config, null, 2) + '\n');
  return true;
}
