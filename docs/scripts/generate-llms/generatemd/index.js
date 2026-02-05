import fs from 'node:fs';
import path from 'node:path';

import { home, general, eas, learn, reference } from '../../../constants/navigation.js';
import { OUTPUT_DIRECTORY_NAME } from '../utils.js';
import { processPage } from './process-page.js';

function collectPageHrefs(node) {
  const hrefs = [];
  if (node.type === 'page' && node.href && !node.href.startsWith('http')) {
    hrefs.push(node.href);
  }
  if (node.children) {
    for (const child of node.children) {
      hrefs.push(...collectPageHrefs(child));
    }
  }
  return hrefs;
}

export async function generateGenerateMd() {
  const referenceSections = reference?.latest || [];
  const allSections = [...home, ...general, ...eas, ...learn, ...referenceSections].filter(Boolean);
  const hrefs = allSections.flatMap(collectPageHrefs);
  let count = 0;

  for (const href of hrefs) {
    let filePath = path.join('pages', href + '.mdx');
    if (!fs.existsSync(filePath)) {
      filePath = path.join('pages', href, 'index.mdx');
      if (!fs.existsSync(filePath)) {
        continue;
      }
    }

    const markdown = await processPage(filePath, href);
    if (!markdown) {
      continue;
    }

    const outputPath = path.join(OUTPUT_DIRECTORY_NAME, href + '.md');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, markdown, 'utf-8');
    count++;
  }

  console.log(` \x1b[1m\x1b[32m✓\x1b[0m Generated ${count} per-page .md files`);
}
