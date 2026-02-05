import fs from 'node:fs';
import path from 'node:path';

export function generateEasCliReferenceMarkdown() {
  const dataPath = path.join(
    process.cwd(),
    'ui/components/EASCLIReference/data/eas-cli-commands.json'
  );

  if (!fs.existsSync(dataPath)) {
    return '';
  }

  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  const commands = Array.isArray(data?.commands) ? data.commands : [];

  if (commands.length === 0) {
    return '';
  }

  const version = data?.source?.cliVersion;
  const header = version ? `### EAS CLI commands (v${version})` : '### EAS CLI commands';

  const blocks = commands
    .map(cmd => {
      const lines = [`#### ${cmd.command}`];
      const desc = cmd.description?.trim();

      if (desc) {
        const normalized = /^[A-Z]/.test(desc) ? desc : `${desc[0].toUpperCase()}${desc.slice(1)}`;
        lines.push(normalized.endsWith('.') ? normalized : `${normalized}.`);
      }

      if (cmd.usage?.trim()) {
        lines.push('```sh', cmd.usage.trim(), '```');
      }
      return lines.join('\n\n');
    })
    .join('\n\n');

  return [header, blocks].filter(Boolean).join('\n\n');
}
