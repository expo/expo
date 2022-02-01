import JsonFile from '@expo/json-file';
import fs from 'fs-extra';
import path from 'path';

export type ProjectSettings = {
  urlRandomness: string | null;
};

// TODO: Remove in favor of a more self-contained ngrok solution.
const projectSettingsDefaults: ProjectSettings = {
  urlRandomness: null,
};

function projectSettingsJsonFile(projectRoot: string): JsonFile<ProjectSettings> {
  return new JsonFile<ProjectSettings>(
    path.join(dotExpoProjectDirectory(projectRoot), 'settings.json')
  );
}

export async function readAsync(projectRoot: string): Promise<ProjectSettings> {
  let projectSettings;
  try {
    projectSettings = await projectSettingsJsonFile(projectRoot).readAsync();
  } catch (e) {
    projectSettings = await projectSettingsJsonFile(projectRoot).writeAsync(
      projectSettingsDefaults
    );
  }
  // Set defaults for any missing fields
  return { ...projectSettingsDefaults, ...projectSettings };
}

export async function setAsync(
  projectRoot: string,
  json: Partial<ProjectSettings>
): Promise<ProjectSettings> {
  try {
    return await projectSettingsJsonFile(projectRoot).mergeAsync(json, {
      cantReadFileDefault: projectSettingsDefaults,
    });
  } catch (e) {
    return await projectSettingsJsonFile(projectRoot).writeAsync({
      ...projectSettingsDefaults,
      ...json,
    });
  }
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
- "packager-info.json": contains port numbers and process PIDs that are used to serve the application to the mobile device/simulator.
- "settings.json": contains the server configuration that is used to serve the application manifest.
> Should I commit the ".expo" folder?
No, you should not share the ".expo" folder. It does not contain any information that is relevant for other developers working on the project, it is specific to your machine.
Upon project creation, the ".expo" folder is already added to your ".gitignore" file.
`
    );
  }
  return dirPath;
}

export function dotExpoProjectDirectoryExists(projectRoot: string): boolean {
  const dirPath = path.join(projectRoot, '.expo');
  try {
    if (fs.statSync(dirPath).isDirectory()) {
      return true;
    }
  } catch (e) {
    // file doesn't exist
  }

  return false;
}
