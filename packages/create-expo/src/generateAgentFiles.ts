import fs from 'fs';
import path from 'path';

function getExpoSdkVersion(root: string): string | null {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf-8'));
    const expoVersion = (pkg.dependencies?.expo ?? pkg.devDependencies?.expo) as string | undefined;
    if (!expoVersion) return null;
    const match = expoVersion.match(/(\d+)\./);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

function getAgentsMdContent(sdkVersion: string | null): string {
  const docsUrl = sdkVersion
    ? `https://docs.expo.dev/versions/v${sdkVersion}.0.0/`
    : 'https://docs.expo.dev';
  return `# Expo HAS CHANGED

Read the exact versioned docs at ${docsUrl} before writing any code.
`;
}

const CLAUDE_MD_CONTENT = `@AGENTS.md
`;

const CLAUDE_SETTINGS_CONTENT = `{
  "enabledPlugins": {
    "expo@claude-plugins-official": true
  }
}
`;

export function generateAgentFiles(root: string): void {
  const sdkVersion = getExpoSdkVersion(root);

  const files: { filePath: string; content: string }[] = [
    { filePath: path.join(root, 'AGENTS.md'), content: getAgentsMdContent(sdkVersion) },
    { filePath: path.join(root, 'CLAUDE.md'), content: CLAUDE_MD_CONTENT },
    { filePath: path.join(root, '.claude', 'settings.json'), content: CLAUDE_SETTINGS_CONTENT },
  ];

  for (const { filePath, content } of files) {
    if (fs.existsSync(filePath)) {
      continue;
    }
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, content);
  }
}
