import marked from 'marked';

export enum TokenType {
  BLOCKQUOTE_END = 'blockquote_end',
  BLOCKQUOTE_START = 'blockquote_start',
  HEADING = 'heading',
  LIST_END = 'list_end',
  LIST_ITEM_END = 'list_item_end',
  LIST_ITEM_START = 'list_item_start',
  LIST_START = 'list_start',
  PARAGRAPH = 'paragraph',
  SPACE = 'space',
}

type SimpleToken<Type> = { type: Type };
type SimpleTokens =
  | TokenType.BLOCKQUOTE_START
  | TokenType.BLOCKQUOTE_END
  | TokenType.LIST_END
  | TokenType.LIST_ITEM_END
  | TokenType.SPACE;

export type TextToken<Type = any> = SimpleToken<Type> & { text: string };

export type HeadingToken = TextToken<TokenType.HEADING> & {
  depth: number;
};

export type ParagraphToken = TextToken<TokenType.PARAGRAPH>;

export type ListStartToken = SimpleToken<TokenType.LIST_START> & {
  ordered: boolean;
  start: string;
  loose: boolean;
};

export type ListItemStartToken = SimpleToken<TokenType.LIST_ITEM_START> & {
  task: boolean;
  checked?: boolean;
  loose: boolean;
};

export type Token =
  | SimpleToken<SimpleTokens>
  | HeadingToken
  | ParagraphToken
  | ListStartToken
  | ListItemStartToken;

export interface Tokens extends ReadonlyArray<Token> {
  links?: any;
}

/**
 * Receives markdown text and returns an array of tokens.
 */
export function lexify(text: string): Tokens {
  return marked.lexer(text);
}

/**
 * Receives an array of tokens and parses them to markdown.
 */
export function parse(tokens: Tokens): string {
  // `marked` module is good enough in terms of lexifying, but its main purpose is to
  // convert markdown to html, so we need to write our own renderer for changelogs.
  const renderer = new ExpoChangelogRenderer();

  // `marked` requires `links` property to be present in the array of tokens.
  if (!tokens.links) {
    tokens.links = {};
  }
  return marked.parser(tokens, { renderer }).trim() + EOL;
}

const EOL = '\n';

class ExpoChangelogRenderer {
  heading(text: string, depth: number): string {
    return '#'.repeat(depth) + ' ' + text + EOL.repeat(2);
  }

  list(body: string): string {
    return body + EOL;
  }

  listitem(body: string): string {
    return '- ' + body + EOL;
  }

  text(text: string): string {
    return text;
  }

  paragraph(text: string): string {
    return text;
  }

  blockquote(quote: string): string {
    const text = quote
      .split(EOL)
      .map(line => '> ' + line)
      .join(EOL);

    return text + EOL;
  }

  strong(text: string): string {
    return '**' + text + '**';
  }

  em(text: string): string {
    return '*' + text + '*';
  }

  del(text: string): string {
    return '~~' + text + '~~';
  }

  codespan(text: string): string {
    return '`' + text + '`';
  }

  code(text: string, infoString: string): string {
    return '```' + infoString + EOL + text + EOL + '```' + EOL;
  }

  link(href: string, title: string, text: string): string {
    return '[' + text + '](' + href + ')';
  }
}
