import fs from 'fs';
import os from 'os';
import path from 'path';

// The CLI is bundled with ncc (webpack), which rewrites `require`/`createRequire` to its own
// module registry — those can't resolve `@expo/llm-configs` on disk. `__non_webpack_require__`
// is left untouched by webpack and resolves to the real Node `require` at runtime; outside the
// bundle (e.g. tests) it is undefined, so we fall back to the regular `require`.
declare const __non_webpack_require__: NodeRequire | undefined;
const requireFromHere: NodeRequire =
  typeof __non_webpack_require__ !== 'undefined' ? __non_webpack_require__ : require;

const AGENT_TEMPLATE_FILE_NAMES = ['AGENTS.md', 'CLAUDE.md'] as const;
const AGENT_TEMPLATE_MODULES: Record<(typeof AGENT_TEMPLATE_FILE_NAMES)[number], string> = {
  'AGENTS.md': '@expo/llm-configs/expo-app/AGENTS.md',
  'CLAUDE.md': '@expo/llm-configs/expo-app/CLAUDE.md',
};

function resolveAgentTemplatePath(fileName: (typeof AGENT_TEMPLATE_FILE_NAMES)[number]): string {
  return requireFromHere.resolve(AGENT_TEMPLATE_MODULES[fileName]);
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

function copyFileIfMissing(sourcePath: string, destinationPath: string): void {
  if (fs.existsSync(destinationPath)) {
    return;
  }
  const dir = path.dirname(destinationPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(sourcePath, destinationPath);
}

function writeFileIfMissing(filePath: string, content: string): void {
  if (fs.existsSync(filePath)) {
    return;
  }
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content);
}

export function generateAgentFiles(root: string): void {
  copyFileIfMissing(resolveAgentTemplatePath('AGENTS.md'), path.join(root, 'AGENTS.md'));

  if (isClaudeCodeInstalled()) {
    copyFileIfMissing(resolveAgentTemplatePath('CLAUDE.md'), path.join(root, 'CLAUDE.md'));
    writeFileIfMissing(path.join(root, '.claude', 'settings.json'), CLAUDE_SETTINGS_CONTENT);
  }
}
