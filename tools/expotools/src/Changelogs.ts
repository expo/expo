import fs from 'fs-extra';

import * as Markdown from './Markdown';

/**
 * Type of the objects representing single changelog entry.
 */
export type ChangelogEntry = {
  /**
   * The change note.
   */
  message: string;
  /**
   * The type of changelog entry.
   */
  type: ChangeType;
  /**
   * The pull request number.
   */
  pullRequests?: number[];
  /**
   * GitHub's user name of someone who made this change.
   */
  authors: string[];
  /**
   * The changelog section which contains this entry.
   */
  version: string;
};

/**
 * Enum with changelog sections that are commonly used by us.
 */
export enum ChangeType {
  BREAKING_CHANGES = '🛠 Breaking changes',
  NEW_FEATURES = '🎉 New features',
  BUG_FIXES = '🐛 Bug fixes',
}

/**
 * Heading name for unpublished changes.
 */
export const UNPUBLISHED_VERSION_NAME = 'master';

/**
 * Depth of headings that mean the version containing following changes.
 */
const VERSION_HEADING_DEPTH = 2;

/**
 * Depth of headings that are being recognized as the type of changes (breaking changes, new features of bugfixes).
 */
const CHANGE_TYPE_HEADING_DEPTH = 3;

/**
 * Class representing a changelog.
 */
export class Changelog {
  filePath: string;
  tokens: Markdown.Tokens | null = null;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  async getTokensAsync(): Promise<Markdown.Tokens> {
    if (!this.tokens) {
      await fs.access(this.filePath, fs.constants.R_OK);
      this.tokens = Markdown.lexify(await fs.readFile(this.filePath, 'utf8'));
    }
    return this.tokens;
  }

  async addChangeAsync(entry: ChangelogEntry): Promise<void> {
    const tokens = [...(await this.getTokensAsync())];
    const sectionIndex = tokens.findIndex(
      token =>
        token.type === Markdown.TokenType.HEADING &&
        token.depth === VERSION_HEADING_DEPTH &&
        token.text === entry.version
    );
    if (sectionIndex === -1) {
      throw new Error(`Version ${entry.version} not found.`);
    }

    for (let i = sectionIndex + 1; i < tokens.length; i++) {
      const token = tokens[i];
      if (
        token.type === Markdown.TokenType.HEADING &&
        token.depth === CHANGE_TYPE_HEADING_DEPTH &&
        token.text === entry.type
      ) {
        const message =
          entry.message[entry.message.length - 1] === '.' ? entry.message : `${entry.message}.`;

        const pullRequestLinks = (entry.pullRequests || [])
          .map(pullRequest => `[#${pullRequest}](https://github.com/expo/expo/pull/${pullRequest})`)
          .join(', ');

        const authors = entry.authors
          .map(author => `[@${author}](https://github.com/${author})`)
          .join(', ');

        const pullRequestInformations = `${pullRequestLinks} by ${authors}`.trim();
        const newTokens: Markdown.Tokens = [
          {
            type: Markdown.TokenType.LIST_ITEM_START,
            loose: false,
            task: false,
          },
          {
            type: Markdown.TokenType.PARAGRAPH,
            text: `${message} (${pullRequestInformations})`,
          },
          {
            type: Markdown.TokenType.LIST_ITEM_END,
          },
        ];

        if (i + 1 < tokens.length && tokens[i + 1].type === Markdown.TokenType.LIST_START) {
          tokens.splice(i + 2, 0, ...newTokens);
        } else {
          tokens.splice(
            i + 1,
            0,
            {
              type: Markdown.TokenType.LIST_START,
              loose: false,
              ordered: false,
              start: '',
            },
            ...newTokens,
            {
              type: Markdown.TokenType.LIST_END,
            }
          );
        }

        await fs.outputFile(this.filePath, Markdown.parse(tokens));

        // Reset cached tokens as we just modified the file.
        // We could use an array with new tokens here, but just for safety, let them be reloaded.
        this.tokens = null;

        return;
      }
    }

    throw new Error(`Cound't find '${entry.type}' section.`);
  }
}

/**
 * Convenient method creating `Changelog` instance.
 */
export function loadFrom(path: string): Changelog {
  return new Changelog(path);
}
