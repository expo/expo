import fs from 'fs';
import path from 'path';

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
- "agent-skill-links.json": remembers which coding agents were selected for the "exagent skills" command.
- "exagent-last-build.json": remembers the native fingerprint of the last successful "exagent start --smart" build per platform, so the next plan can skip an unnecessary rebuild.
- "dev/logs/": contains structured JSONL event logs from CLI commands (e.g. start.log, export.log). These are truncated on each run.

> Should I commit the ".expo" folder?

No, you should not share the ".expo" folder. It does not contain any information that is relevant for other developers working on the project, it is specific to your machine.
Upon project creation, the ".expo" folder is already added to your ".gitignore" file.
`
    );
  }
  return dirPath;
}
