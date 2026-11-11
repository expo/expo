interface Structure {
  frontmatterKeys: string[];
  imports: string[];
  codeBlocks: string[];
  counts: Map<string, number>;
}

export interface StructureChange {
  englishBefore: string;
  englishAfter: string;
  japaneseBefore: string;
  japaneseAfter: string;
}

const FENCE_OPEN = /^\s*(`{3,}|~{3,})/;
const FENCE_CLOSE = /^\s*(`{3,}|~{3,})\s*$/;
const PROSE_FENCE = /^\s*(`{3,}|~{3,})text\b/;
const TUTINFO_TEXT = /\/\* @tutinfo[\S\s]*?\*\//g;

function increment(counts: Map<string, number>, name: string, amount = 1) {
  counts.set(name, (counts.get(name) ?? 0) + amount);
}

function readStructure(source: string): Structure {
  const lines = source.split('\n');
  const structure: Structure = {
    frontmatterKeys: [],
    imports: [],
    codeBlocks: [],
    counts: new Map(),
  };

  let index = 0;
  if (lines[0] === '---') {
    for (index = 1; index < lines.length && lines[index] !== '---'; index++) {
      const key = /^([A-Z_a-z][\w-]*):/.exec(lines[index]);
      if (key) {
        structure.frontmatterKeys.push(key[1]);
      }
    }
    index++;
  }

  let fence: string | undefined;
  let block: string[] = [];
  let statement: string[] = [];

  for (; index < lines.length; index++) {
    const line = lines[index];

    if (fence !== undefined) {
      block.push(line);
      const close = FENCE_CLOSE.exec(line);
      if (close?.[1][0] === fence[0] && close[1].length >= fence.length) {
        if (!PROSE_FENCE.test(block[0])) {
          structure.codeBlocks.push(block.join('\n').replace(TUTINFO_TEXT, '/* @tutinfo */'));
        }
        fence = undefined;
        block = [];
      }
      continue;
    }

    if (statement.length > 0 || /^(import|export)\s/.test(line)) {
      statement.push(line);
      if (/\sfrom\s/.test(line) || line.trimEnd().endsWith(';')) {
        structure.imports.push(statement.join('\n'));
        statement = [];
      }
      continue;
    }

    const open = FENCE_OPEN.exec(line);
    if (open) {
      fence = open[1];
      block = [line];
      continue;
    }

    if (/^#{1,6}\s/.test(line)) {
      increment(structure.counts, 'headings');
    }

    const prose = line.replace(/`[^`]*`/g, '');
    for (const tag of prose.matchAll(/<([A-Z][\w.]*)/g)) {
      increment(structure.counts, `<${tag[1]}> tags`);
    }
    increment(structure.counts, 'links', prose.match(/\[[^\]]*]\([^)]*\)/g)?.length ?? 0);
  }

  return structure;
}

function listChange(before: string[], after: string[]): string {
  const removed = [...before];
  const added: string[] = [];
  for (const item of after) {
    const match = removed.indexOf(item);
    if (match === -1) {
      added.push(item);
    } else {
      removed.splice(match, 1);
    }
  }
  return JSON.stringify({ added: added.sort(), removed: removed.sort() });
}

export function compareStructureChange(change: StructureChange): string[] {
  const englishBefore = readStructure(change.englishBefore);
  const englishAfter = readStructure(change.englishAfter);
  const japaneseBefore = readStructure(change.japaneseBefore);
  const japaneseAfter = readStructure(change.japaneseAfter);
  const problems: string[] = [];

  const lists = [
    ['frontmatter keys', 'frontmatterKeys'],
    ['import lines', 'imports'],
    ['code blocks', 'codeBlocks'],
  ] as const;
  for (const [label, field] of lists) {
    const englishChange = listChange(englishBefore[field], englishAfter[field]);
    const japaneseChange = listChange(japaneseBefore[field], japaneseAfter[field]);
    if (englishChange !== japaneseChange) {
      problems.push(`${label} changed differently`);
    }
  }

  const names = new Set(
    [englishBefore, englishAfter, japaneseBefore, japaneseAfter].flatMap(structure => [
      ...structure.counts.keys(),
    ])
  );
  for (const name of names) {
    const englishDelta =
      (englishAfter.counts.get(name) ?? 0) - (englishBefore.counts.get(name) ?? 0);
    const japaneseDelta =
      (japaneseAfter.counts.get(name) ?? 0) - (japaneseBefore.counts.get(name) ?? 0);
    if (englishDelta !== japaneseDelta) {
      problems.push(
        `${name} changed by ${englishDelta} in English and ${japaneseDelta} in Japanese`
      );
    }
  }

  return problems;
}
