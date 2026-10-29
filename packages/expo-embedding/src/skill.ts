import { join } from 'node:path';

import { readText } from './files';
import { usage } from './usage';

export type MigrationReport = {
  schemaVersion: 1;
  usage: string;
  root: string;
  platform: 'ios';
  selection: Record<string, string>;
  changes: { path: string; before?: string; after: string }[];
  preview: string;
  guide: string;
};

export async function printSkill(
  packageRoot: string,
  json: boolean,
  context: Omit<MigrationReport, 'schemaVersion' | 'usage' | 'guide'>
): Promise<void> {
  const report: MigrationReport = {
    schemaVersion: 1,
    usage,
    ...context,
    guide: await readText(join(packageRoot, 'templates', context.platform, 'INTEGRATION.md')),
  };
  process.stdout.write(
    json
      ? JSON.stringify(report, null, 2) + '\n'
      : `${usage}\n# Host\n\n${JSON.stringify({ root: report.root, platform: report.platform, ...report.selection }, null, 2)}\n\n` +
          `# Proposed host edits\n\n${report.preview}\n\n${report.guide}\n`
  );
}
