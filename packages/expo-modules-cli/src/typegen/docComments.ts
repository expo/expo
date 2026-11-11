import { parse } from '@babel/parser';
import type { Comment, Node, TSTypeElement } from '@babel/types';

export type DocCommentWarning = {
  /** A comment that was dropped, or one kept above a declaration that changed. */
  kind: 'dropped' | 'changed';
  /** Absolute path of the generated file. */
  file: string;
  /**
   * The symbol in TypeScript names: `Type`, `Type.member`, or `Type.member#2` for a later overload.
   * `line <n>` for a comment above no declaration or member.
   */
  location: string;
  message: string;
  /** The text of a dropped comment, so it can be added back by hand. */
  comment?: string;
};

export type PreservedDocComments = {
  /** The source with the comments in place, or `null` when there is no source to write. */
  source: string | null;
  warnings: DocCommentWarning[];
};

type DocumentedSymbol = {
  /**
   * Identifies the symbol across runs: `Type`, `Type.member`, or `Type.static member`. Overloads
   * share a name.
   */
  name: string;
  /** The name for warnings, with `#<n>` appended to the nth symbol of the same name. */
  location: string;
  /** Offset of the first character of the declaration, after its comments. */
  start: number;
  /**
   * The tokens of a member or of a type alias that is not an object type, without formatting.
   * `null` for a declaration with a body, whose members carry their own comments.
   */
  signature: string | null;
  /** The block comments above the symbol, by line, without the indentation they start at. */
  comment: string[];
};

type Token = { type: string | { label: string }; value?: unknown; start: number; end: number };

/**
 * Copies the comments of `previous`, the generated file as it is on disk, into `source`, a new
 * render of that file. Each comment goes above the symbol with the same TypeScript name, so it
 * follows the symbol when declarations move. An overload keeps its comment while its signature
 * stays the same. A comment whose symbol is gone is dropped, and a comment kept above a member or
 * one-line declaration that changed is reported, since it may no longer describe it. Throws when
 * `previous` does not parse.
 */
export function preserveDocComments(
  source: string | null,
  previous: string,
  file: string
): PreservedDocComments {
  let read: ReturnType<typeof readSymbols>;
  try {
    read = readSymbols(previous);
  } catch (error) {
    throw new Error(
      `Could not read the doc comments of ${file}: ${(error as Error).message}. Fix the syntax ` +
        'error, or delete the file to generate it again without doc comments.',
      { cause: error }
    );
  }
  const warnings: DocCommentWarning[] = read.strays.map((stray) => ({
    kind: 'dropped',
    file,
    location: `line ${stray.line}`,
    message:
      'the comment below does not document a declaration or member, so it was dropped. Add it ' +
      'above the declaration it describes',
    comment: stray.comment.join('\n'),
  }));
  let pairs = new Map<DocumentedSymbol, DocumentedSymbol>();
  let merged: string | null = null;
  if (source !== null) {
    const symbols = readSymbols(source).symbols;
    pairs = pairSymbols(read.symbols, symbols);
    merged = '';
    let copied = 0;
    for (const symbol of symbols) {
      const kept = pairs.get(symbol);
      if (!kept || kept.comment.length === 0) {
        continue;
      }
      // `renderSurface` starts every declaration and member on its own line.
      const declarationLine = lineStart(source, symbol.start);
      const indent = source.slice(declarationLine, symbol.start);
      merged +=
        source.slice(copied, declarationLine) +
        kept.comment.map((line) => `${line ? indent : ''}${line}\n`).join('');
      copied = declarationLine;
      if (kept.signature && symbol.signature && kept.signature !== symbol.signature) {
        warnings.push({
          kind: 'changed',
          file,
          location: symbol.location,
          message: 'the declaration changed, so check that its doc comment is still accurate',
        });
      }
    }
    merged += source.slice(copied);
  }
  const kept = new Set(pairs.values());
  for (const symbol of read.symbols) {
    if (symbol.comment.length === 0 || kept.has(symbol)) {
      continue;
    }
    warnings.push({
      kind: 'dropped',
      file,
      location: symbol.location,
      message:
        'no longer generated, so its doc comment was dropped. If it was renamed, add the comment ' +
        'below to the new name',
      comment: symbol.comment.join('\n'),
    });
  }
  return { source: merged, warnings };
}

/**
 * Maps each symbol of the new render to the symbol of the previous file that it continues, whether
 * or not that one has a comment. Among symbols of the same name, which are overloads, an unchanged
 * signature pairs first and the rest pair in order.
 */
function pairSymbols(
  previous: DocumentedSymbol[],
  symbols: DocumentedSymbol[]
): Map<DocumentedSymbol, DocumentedSymbol> {
  const pairs = new Map<DocumentedSymbol, DocumentedSymbol>();
  const taken = new Set<DocumentedSymbol>();
  const pairWhere = (
    matches: (symbol: DocumentedSymbol, candidate: DocumentedSymbol) => boolean
  ) => {
    for (const symbol of symbols) {
      if (pairs.has(symbol)) {
        continue;
      }
      const match = previous.find(
        (candidate) =>
          !taken.has(candidate) && candidate.name === symbol.name && matches(symbol, candidate)
      );
      if (match) {
        pairs.set(symbol, match);
        taken.add(match);
      }
    }
  };
  pairWhere((symbol, candidate) => candidate.signature === symbol.signature);
  pairWhere(() => true);
  return pairs;
}

/**
 * The declarations and members of a generated file in file order, each with the block comments
 * right above it, and the block comments above anything else.
 */
function readSymbols(text: string): {
  symbols: DocumentedSymbol[];
  strays: { line: number; comment: string[] }[];
} {
  const ast = parse(text, { sourceType: 'module', plugins: ['typescript'], tokens: true });
  const tokens: Token[] = (ast.tokens ?? []).filter(
    (token: Token) => typeof token.type !== 'string'
  );
  const symbols: DocumentedSymbol[] = [];
  const attached = new Set<Comment>();
  const occurrences = new Map<string, number>();

  const add = (name: string, node: Node, hasSignature: boolean) => {
    const occurrence = (occurrences.get(name) ?? 0) + 1;
    occurrences.set(name, occurrence);
    const comment: string[] = [];
    for (const block of node.leadingComments ?? []) {
      // Babel also lists a comment that follows code on its line, which documents that code
      // instead. It stays unattached, so the run reports it as dropped.
      if (block.type !== 'CommentBlock' || followsCode(text, block)) {
        continue;
      }
      attached.add(block);
      comment.push(...commentLines(text, block));
    }
    symbols.push({
      name,
      location: occurrence === 1 ? name : `${name}#${occurrence}`,
      start: node.start ?? 0,
      signature: hasSignature ? signature(text, tokens, node) : null,
      comment,
    });
  };
  const addTypeMembers = (owner: string, members: TSTypeElement[]) => {
    for (const member of members) {
      if (member.type === 'TSPropertySignature' || member.type === 'TSMethodSignature') {
        add(`${owner}.${keyName(text, member.key)}`, member, true);
      }
    }
  };

  for (const statement of ast.program.body) {
    // Comments above an exported declaration belong to the `export` statement.
    const declaration =
      statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement;
    if (declaration?.type === 'TSEnumDeclaration') {
      add(declaration.id.name, statement, false);
      for (const member of declaration.members) {
        add(`${declaration.id.name}.${keyName(text, member.id)}`, member, true);
      }
    } else if (declaration?.type === 'TSTypeAliasDeclaration') {
      const name = declaration.id.name;
      const type = declaration.typeAnnotation;
      add(name, statement, type.type !== 'TSTypeLiteral');
      if (type.type === 'TSTypeLiteral') {
        addTypeMembers(name, type.members);
      }
    } else if (declaration?.type === 'ClassDeclaration' && declaration.id) {
      const name = declaration.id.name;
      add(name, statement, false);
      // An events map inlined into the `extends` clause is keyed like a declared `<Name>Events`
      // type, so its comments survive a switch between the two.
      if (declaration.superTypeParameters?.type === 'TSTypeParameterInstantiation') {
        for (const param of declaration.superTypeParameters.params) {
          if (param.type === 'TSTypeLiteral') {
            addTypeMembers(`${name}Events`, param.members);
          }
        }
      }
      for (const member of declaration.body.body) {
        if (
          member.type === 'ClassProperty' ||
          member.type === 'ClassMethod' ||
          member.type === 'TSDeclareMethod'
        ) {
          const modifier = member.static ? 'static ' : '';
          add(`${name}.${modifier}${keyName(text, member.key)}`, member, true);
        }
      }
    }
  }
  const strays = (ast.comments ?? [])
    .filter((block) => block.type === 'CommentBlock' && !attached.has(block))
    .map((block) => ({ line: block.loc?.start.line ?? 0, comment: commentLines(text, block) }));
  return { symbols, strays };
}

/** The lines of a block comment, without the indentation of the line it starts on. */
function commentLines(text: string, block: Comment): string[] {
  const start = block.start ?? 0;
  const column = start - lineStart(text, start);
  return text
    .slice(start, block.end)
    .split(/\r?\n/)
    .map((line) => dedent(line, column));
}

/** Whether code comes before the comment on the line it starts on. */
function followsCode(text: string, block: Comment): boolean {
  const start = block.start ?? 0;
  return text.slice(lineStart(text, start), start).trim() !== '';
}

/** Offset of the first character of the line that `offset` is on. */
function lineStart(text: string, offset: number): number {
  return text.lastIndexOf('\n', offset - 1) + 1;
}

/** The name a member key spells, unquoted: `"foo-bar"` and `'foo-bar'` both read `foo-bar`. */
function keyName(text: string, key: Node): string {
  switch (key.type) {
    case 'Identifier':
      return key.name;
    case 'StringLiteral':
      return key.value;
    case 'NumericLiteral':
      return String(key.value);
    default:
      return text.slice(key.start ?? 0, key.end ?? 0);
  }
}

/**
 * The tokens of `node` joined by spaces, so that line breaks, quote style, a trailing comma before
 * a closing bracket, and the member's own terminator do not count as a change.
 */
function signature(text: string, tokens: Token[], node: Node): string {
  const start = node.start ?? 0;
  const end = node.end ?? 0;
  const spelled = tokens
    .filter((token) => token.start >= start && token.end <= end)
    .map((token) =>
      typeof token.type !== 'string' && token.type.label === 'string'
        ? JSON.stringify(token.value)
        : text.slice(token.start, token.end)
    );
  return spelled
    .filter((token, index) => {
      const next = spelled[index + 1];
      if (next === undefined) {
        return token !== ';' && token !== ',';
      }
      return !(token === ',' && [')', ']', '}', '>'].includes(next));
    })
    .join(' ');
}

/** The line without up to `indent` characters of leading whitespace. */
function dedent(line: string, indent: number): string {
  const leading = line.length - line.trimStart().length;
  return line.slice(Math.min(indent, leading));
}
