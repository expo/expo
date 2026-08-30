import fs from 'fs';
import path from 'path';

import { PROGRAM_NAME } from '../programName';

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
- "agent-skill-links.json": remembers which coding agents were selected for the "${PROGRAM_NAME} skills" command.
- "agent-cli-last-build.json": remembers the native fingerprint of the last successful "${PROGRAM_NAME} dev" build per platform, so the next plan can skip an unnecessary rebuild.
- "agent-cli-eas-builds.json": remembers a finished EAS build that "${PROGRAM_NAME} status --explain" found for this project's current fingerprint, so the next "${PROGRAM_NAME} status" can report it without calling EAS again. The entry is dropped as soon as the project fingerprint changes.
- "agent-cli-fingerprint.json": remembers the native fingerprint of this project per platform, so a command that needs it does not spend a second hashing an unchanged project. Every entry records the size and modification time of the files it was computed against — the lockfiles, the app config, "eas.json", "package.json", the fingerprint's own settings and the assets they point at — and is only believed again while all of them are unchanged, and never for longer than ten minutes. It does not look inside "ios" or "android", so the ten minutes is what covers a native edit; "${PROGRAM_NAME} dev" deletes the whole file after any step that changes the project. A report answered from here says so, with the check it used and the age of the answer. Delete it, or pass "--no-fingerprint-cache", to hash the project again.
- "agent-cli-dev-server.sock": a socket the "${PROGRAM_NAME} start" and "${PROGRAM_NAME} dev" commands listen on while they run a dev server, so other commands can ask which port it is on instead of scanning for it. It holds no data on disk: connecting to it is what answers. A leftover file from a stopped dev server answers nothing and is replaced by the next one.
- "dev/logs/": contains structured JSONL event logs from CLI commands (e.g. start.log, export.log). These are truncated on each run.
- "dev/logs/dev-detached.log": everything a dev server started with "${PROGRAM_NAME} dev --detach" printed, since that run has no terminal to print it to. Read it with "${PROGRAM_NAME} dev:logs". One file per project, truncated on each detached run, because a project has at most one detached dev server.

> Should I commit the ".expo" folder?

No, you should not share the ".expo" folder. It does not contain any information that is relevant for other developers working on the project, it is specific to your machine.
Upon project creation, the ".expo" folder is already added to your ".gitignore" file.
`
    );
  }
  return dirPath;
}
