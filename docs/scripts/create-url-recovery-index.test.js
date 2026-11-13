import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import createUrlRecoveryIndex from './create-url-recovery-index.js';

test('indexes only exported sitemap URLs, including metadata and pages without MDX', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'url-recovery-'));
  try {
    fs.mkdirSync(path.join(directory, 'router'));
    fs.writeFileSync(
      path.join(directory, 'router/index.mdx'),
      '---\ntitle: Expo Router\ndescription: File-based navigation\n---\n'
    );
    fs.writeFileSync(path.join(directory, 'hidden.mdx'), '---\ntitle: Hidden\n---\n');
    const output = path.join(directory, 'index.json');
    const pages = createUrlRecoveryIndex({
      urls: ['/router/', '/bare/upgrade/', '/versions/v57.0.0'],
      pagesDirectory: directory,
      output,
    });

    expect(pages).toEqual([
      { path: '/router/', title: 'Expo Router', description: 'File-based navigation' },
      { path: '/bare/upgrade/', title: '/bare/upgrade/', description: '' },
      { path: '/versions/v57.0.0/', title: '/versions/v57.0.0', description: '' },
    ]);
    expect(JSON.parse(fs.readFileSync(output, 'utf8'))).toEqual(pages);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
