import JsonFile, { JSONObject } from '@expo/json-file';
import fs from 'fs-extra';
import path from 'path';

export function createTemporaryProjectFile<T extends JSONObject>(fileName: string, defaults: T) {
  function getFile(projectRoot: string): JsonFile<T> {
    return new JsonFile<T>(path.join(dotExpoProjectDirectory(projectRoot), fileName));
  }

  async function readAsync(projectRoot: string): Promise<T> {
    let projectSettings;
    try {
      projectSettings = await getFile(projectRoot).readAsync();
    } catch (e) {
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
    } catch (e) {
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

export function dotExpoProjectDirectory(projectRoot: string): string {
  const dirPath = path.join(projectRoot, '.expo');
  fs.mkdirpSync(dirPath);

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
