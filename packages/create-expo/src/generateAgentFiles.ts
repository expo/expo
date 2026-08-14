import fs from 'fs';
import os from 'os';
import path from 'path';

const AGENT_TEMPLATE_FILE_NAMES = ['AGENTS.md', 'CLAUDE.md'] as const;

// Agent templates are synced from `expo/llm-configs` at publish time (see
// `scripts/sync-agent-templates.js`) and bundled under `template/agent-files`, so project
// creation works offline. `__dirname` is the build output directory, one level below the
// package root in both the source tree and the published package.
const AGENT_TEMPLATES_DIR = path.join(__dirname, '..', 'template', 'agent-files');

function resolveAgentTemplatePath(fileName: (typeof AGENT_TEMPLATE_FILE_NAMES)[number]): string {
  return path.join(AGENT_TEMPLATES_DIR, fileName);
}

const CLAUDE_SETTINGS_CONTENT = `{
  "enabledPlugins": {
    "expo@claude-plugins-official": true
  }
}
`;

function isClaudeCodeInstalled(): boolean {
  const home = os.homedir();
  return (
    !!home &&
    (fs.existsSync(path.join(home, '.claude.json')) || fs.existsSync(path.join(home, '.claude')))
  );
}

async function copyFileIfMissing(sourcePath: string, destinationPath: string): Promise<void> {
  if (fs.existsSync(destinationPath)) {
    return;
  }
  const dir = path.dirname(destinationPath);
  await fs.promises.mkdir(dir, { recursive: true });
  await fs.promises.copyFile(sourcePath, destinationPath);
}

async function writeFileIfMissing(filePath: string, content: string): Promise<void> {
  if (fs.existsSync(filePath)) {
    return;
  }
  const dir = path.dirname(filePath);
  await fs.promises.mkdir(dir, { recursive: true });
  await fs.promises.writeFile(filePath, content);
}

export async function generateAgentFiles(root: string): Promise<void> {
  const tasks: Promise<void>[] = [
    copyFileIfMissing(resolveAgentTemplatePath('AGENTS.md'), path.join(root, 'AGENTS.md')),
  ];

  if (isClaudeCodeInstalled()) {
    tasks.push(
      copyFileIfMissing(resolveAgentTemplatePath('CLAUDE.md'), path.join(root, 'CLAUDE.md')),
      writeFileIfMissing(path.join(root, '.claude', 'settings.json'), CLAUDE_SETTINGS_CONTENT)
    );
  }

  await Promise.all(tasks);
}
