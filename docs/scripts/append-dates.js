import spawnAsync from '@expo/spawn-async';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const CONCURRENCY = 20;

async function processFile(filePath) {
  const { stdout } = await spawnAsync(
    'git',
    ['log', '-1', '--pretty="%cd"', '--date=format:"%B %d, %Y"', filePath],
    { stdio: 'pipe' }
  );

  const fileContent = (await readFile(filePath, 'utf8')).split('\n');
  const cleanDate = stdout.replace('\n', '').replaceAll('"', '');
  const modificationDateLine = `modificationDate: ${cleanDate}`;

  if (!fileContent[1].startsWith('modificationDate')) {
    fileContent.splice(1, 0, modificationDateLine);
  }

  await writeFile(filePath, fileContent.join('\n'), 'utf8');
}

async function appendModificationDate(dir = './pages') {
  try {
    const files = await readdir(dir, { recursive: true, withFileTypes: true });
    const mdxFiles = files
      .filter(file => !file.isDirectory() && file.name.endsWith('.mdx'))
      .map(file => path.join(file.path, file.name));

    // Process files in batches with limited concurrency
    for (let i = 0; i < mdxFiles.length; i += CONCURRENCY) {
      const batch = mdxFiles.slice(i, i + CONCURRENCY);
      await Promise.all(batch.map(processFile));
    }

    console.log(` \x1b[1m\x1b[32m✓\x1b[0m Appended modification dates to doc files`);
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

appendModificationDate();
