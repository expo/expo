import spawnAsync from '@expo/spawn-async';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

async function appendModificationDate(dir = './pages') {
  try {
    const files = await readdir(dir, { recursive: true, withFileTypes: true });

    for (const file of files) {
      if (!file.isDirectory() && file.name.endsWith('.mdx')) {
        const filePath = path.join(file.path, file.name);

        const { stdout } = await spawnAsync(
          'git',
          ['log', '-1', '--pretty="%cd"', '--date=format:"%B %d, %Y"', filePath],
          {
            stdio: 'pipe',
          }
        );

        const fileContent = (await readFile(filePath, 'utf8')).split('\n');
        const cleanDate = stdout.replace('\n', '').replaceAll('"', '');
        const modificationDateLine = `modificationDate: ${cleanDate}`;

        if (!fileContent[1].startsWith('modificationDate')) {
          fileContent.splice(1, 0, modificationDateLine);
        }

        await writeFile(filePath, fileContent.join('\n'), 'utf8');
      }
    }

    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

appendModificationDate();
