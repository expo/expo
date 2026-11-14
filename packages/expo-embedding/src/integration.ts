import { join } from 'node:path';

import { readText } from './files';
import { usage } from './usage';

export async function printIntegrationInstructions(
  packageRoot: string,
  context: {
    root: string;
    platform: 'ios' | 'android';
    selection: Record<string, string>;
    preview?: string;
  }
): Promise<void> {
  const guide = await readText(join(packageRoot, 'templates', context.platform, 'INTEGRATION.md'));
  process.stdout.write(
    `\nNative setup completed. Follow the guide below to finish or verify source integration.\n\n${usage}\n` +
      `# Host\n\n${JSON.stringify({ root: context.root, platform: context.platform, ...context.selection }, null, 2)}\n\n` +
      (context.preview ? `# Applied host edits\n\n${context.preview}\n\n` : '') +
      guide +
      '\n'
  );
}
