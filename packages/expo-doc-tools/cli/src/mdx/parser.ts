import fs from 'fs';
import matter from 'gray-matter';
import path from 'path';

import VectorDb from '../db/vectorDb';
import { embedText } from '../utils/embedding';

/**
 * Indexes MDX files in a directory and saves the metadata, content, and embeddings to a database.
 * @param directory Directory containing MDX files
 * @param dbpath Path to save the database file
 */
export const indexMdxFiles = async (directory: string, dbpath: string) => {
  console.log(`Building vector database from ${directory} into database at ${dbpath}...`);
  const files = await fs.promises.readdir(directory);
  const db = await new VectorDb();
  let pageCount = 0;
  for (const file of files) {
    const filePath = path.join(directory, file);
    if (path.extname(file) === '.mdx') {
      try {
        const { metadata, content } = await parseMdx(filePath);
        const embedding = await embedText(content);
        db.addDocument(file, { metadata, content, embedding });
        pageCount++;
      } catch (err) {
        throw new Error('Error processing file:' + file + '\n' + err);
      }
    }
  }
  db.saveToFile(dbpath).catch((err) => {
    throw new Error('Error saving database to file: ' + dbpath + '\n' + err);
  });
  console.log(`Indexed ${pageCount} MDX files from ${directory} into database at ${dbpath}`);
};

async function parseMdx(filePath: string): Promise<any> {
  const fileContent = await fs.promises.readFile(filePath, 'utf-8');
  // Extract frontmatter and content
  const { data: metadata, content: mdContent } = matter(fileContent);

  const { unified } = await import('unified');
  const remarkParse = (await import('remark-parse')).default;
  const remarkStringify = (await import('remark-stringify')).default;
  const { VFile } = await import('vfile');

  // Parse MDX to plain text (strip JSX, etc.)
  const file = new VFile({ value: mdContent });
  const processed = await unified().use(remarkParse).use(remarkStringify).process(file);
  const content = String(processed);
  return {
    metadata,
    content,
  };
}
