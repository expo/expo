import JsonFile, { JSONObject } from '@expo/json-file';
import fs from 'fs';
import path from 'path';

/** Create a set of functions for managing a file in the project's `.expo` directory. */
export function createTemporaryProjectFile<T extends JSONObject>(fileName: string, defaults: T) {
  function getFile(projectRoot: string): JsonFile<T> {
    const dotExpoDir = ensureDotExpoProjectDirectoryInitialized(projectRoot);
    return new JsonFile<T>(path.join(dotExpoDir, fileName));
  }

  async function readAsync(projectRoot: string): Promise<T> {
    let projectSettings;
    try {
      projectSettings = await getFile(projectRoot).readAsync();
    } catch {
      projectSettings = await getFile(projectRoot).writeAsync(defaults);
    }
    // Set defaults for any missing fields
    return { ...defaults, ...projectSettings };
  }

  async function setAsync(projectRoot: string, json: Partial<T>): Promise<T> {
    try {
      return await getFile(projectRoot).mergeAsync(json, {
        cantReadFileDefault: defaults,
      });
    } catch {
      return await getFile(projectRoot).writeAsync({
        ...defaults,
        ...json,
      });
    }
  }

  return {
    getFile,
    readAsync,
    setAsync,
  };
}

function getDotExpoProjectDirectory(projectRoot: string): string {
  return path.join(projectRoot, '.expo');
}

export function ensureDotExpoProjectDirectoryInitialized(projectRoot: string): string {
  const dirPath = getDotExpoProjectDirectory(projectRoot);
  fs.mkdirSync(dirPath, { recursive: true });

  const readmeFilePath = path.resolve(dirPath, 'README.md');
  if (!fs.existsSync(readmeFilePath)) {
    fs.writeFileSync(
      readmeFilePath,
      `> Why do I have a folder named ".expo" in my project?
The ".expo" folder is created when an Expo project is started using "expo start" command.
> What do the files contain?
- "devices.json": contains information about devices that have recently opened this project. This is used to populate the "Development sessions" list in your development builds.
- "settings.json": contains the server configuration that is used to serve the application manifest.
> Should I commit the ".expo" folder?
No, you should not share the ".expo" folder. It does not contain any information that is relevant for other developers working on the project, it is specific to your machine.
Upon project creation, the ".expo" folder is already added to your ".gitignore" file.
`
    );
  }
  return dirPath;
}
