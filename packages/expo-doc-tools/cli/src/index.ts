import chalk from 'chalk';
import { cliExtension, ExpoCliOutput } from 'expo-cli-extensions';
import path from 'path';
import terminalLink from 'terminal-link';

import VectorDb from './db/vectorDb';
import { embedText } from './utils/embedding';

const DB_PATH = './db.json';

cliExtension<{ search_docs: { query: string } }>(
  async (cmd: string, args: Record<string, string | number | boolean>) => {
    // Validate command
    if (cmd === 'search_docs') {
      try {
        const query = args.query.toString().trim();
        if (!query) {
          throw new Error('No search query provided.');
        }

        // Open database
        const toolpath = process.argv[1];
        const dbFile = path.join(toolpath, '../../', DB_PATH);
        const db = await new VectorDb().loadFromFile(dbFile);
        if (!db) {
          throw new Error(`Database not found or could not be loaded from ${dbFile}.`);
        }
        const embeddings = await embedText(query);

        // Search the database and return the results - check the source argument to ensure we return the
        // corretly formatted results.
        const results = await db.search(embeddings, args.source === 'mcp' ? 2 : 5);
        if (args.source === 'mcp') {
          // Return results as objects with metadata
          return results.map((r) => ({
            type: 'text',
            text: JSON.stringify({
              ...r.metadata,
              content: r.content,
              score: (r.score * 100).toFixed(2) + '%',
            }),
          }));
        } else {
          // Emit results as links to the documentation with scores
          return results.map((r) => ({
            type: 'text',
            url: r.metadata.url,
            text: r.metadata.title + ` (${(r.score * 100).toFixed(2) + '%'})`,
          }));
        }
      } catch (error: any) {
        throw new Error('An error occured connecting to the app:' + error.toString());
      }
    } else if (cmd === 'test_command') {
      console.log('Documentation search is working.');
    } else {
      return Promise.reject(new Error(`The command ${cmd} is an unknown command for this tool.`));
    }
  }
);

function link(
  url: string,
  { text = url, dim = true }: { text?: string; dim?: boolean } = {}
): string {
  let output: string;
  if (terminalLink.isSupported) {
    output = terminalLink(text, url); // Creates clickable link
  } else {
    output = `${text === url ? '' : text + ': '}${chalk.blue.underline(url)}`; // Fallback with blue underline
  }
  return dim ? chalk.dim(output) : output;
}
