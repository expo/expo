/**
 * Worker thread for generate-markdown-pages.ts.
 * Receives { type: 'task', htmlPath } messages, converts HTML → Markdown, writes .md file.
 * Sends back { type: 'result', htmlPath, status, warnings? } messages.
 */

import fs from 'node:fs';
import path from 'node:path';
import { parentPort, workerData } from 'node:worker_threads';

import { checkMarkdownQuality, convertHtmlToMarkdown } from './generate-markdown-pages-utils.ts';

const outDir: string = workerData.outDir;

parentPort!.on('message', (msg: { type: string; htmlPath?: string }) => {
  if (msg.type === 'done') {
    process.exit(0);
  }

  if (msg.type === 'task') {
    const htmlPath = msg.htmlPath!;
    const html = fs.readFileSync(htmlPath, 'utf-8');
    const markdown = convertHtmlToMarkdown(html);

    const rel = path.relative(outDir, htmlPath);
    const warnings = checkMarkdownQuality(markdown, rel);

    const mdPath = path.join(path.dirname(htmlPath), 'index.md');
    fs.writeFileSync(mdPath, markdown);

    parentPort!.postMessage({
      type: 'result',
      htmlPath,
      status: 'generated',
      warnings: warnings.length > 0 ? warnings.map(w => `${rel}: ${w}`) : undefined,
    });
  }
});
