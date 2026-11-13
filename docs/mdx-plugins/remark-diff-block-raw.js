import fs from 'node:fs';
import path from 'node:path';
import { visit } from 'unist-util-visit';

const DEFAULT_OPTIONS = {
  publicDir: 'public',
  components: ['DiffBlock'],
};

export default function remarkDiffBlockRaw(options) {
  const settings = { ...DEFAULT_OPTIONS, ...options };

  return (tree, file) => {
    if (!file.cwd) {
      return;
    }

    visit(tree, ['mdxJsxFlowElement', 'mdxJsxTextElement'], node => {
      if (!settings.components.includes(node.name)) {
        return;
      }

      const attributes = node.attributes.filter(attribute => attribute.type === 'mdxJsxAttribute');
      const source = attributes.find(attribute => attribute.name === 'source')?.value;

      if (typeof source !== 'string' || !source.startsWith('/static/')) {
        return;
      }
      if (attributes.some(attribute => attribute.name === 'raw')) {
        return;
      }

      const raw = readDiffFile(path.join(file.cwd, settings.publicDir, source));
      if (raw) {
        node.attributes.push({ type: 'mdxJsxAttribute', name: 'raw', value: raw });
      }
    });
  };
}

function readDiffFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}
