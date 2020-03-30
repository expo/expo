import fs from 'fs-extra';
import semver from 'semver';

import * as Markdown from './Markdown';

/**
 * Type of the objects representing changelog entries.
 */
export type ChangelogChanges = {
  totalCount: number;
  versions: {
    [key: string]: {
      [key in ChangeType]?: string[];
    };
  };
};

export type ChangelogNewEntry = {
  message: string;
  type: ChangeType;
  pullRequest: number;
  author: string;
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
const UNPUBLISHED_VERSION_NAME = 'master';

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

  async getVersionsAsync(): Promise<string[]> {
    const tokens = await this.getTokensAsync();
    const versionTokens = tokens.filter(
      token => token.type === Markdown.TokenType.HEADING && token.depth === VERSION_HEADING_DEPTH
    ) as Markdown.HeadingToken[];

    return versionTokens.map(token => token.text);
  }

  async getLastPublishedVersionAsync(): Promise<string | null> {
    const versions = await this.getVersionsAsync();
    return versions.find(version => semver.valid(version)) ?? null;
  }

  async getChangesAsync(
    fromVersion?: string,
    toVersion: string = UNPUBLISHED_VERSION_NAME
  ): Promise<ChangelogChanges> {
    const tokens = await this.getTokensAsync();
    const versions = {};
    const changes: ChangelogChanges = { totalCount: 0, versions };

    let currentVersion: string | null = null;
    let currentSection: string | null = null;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (token.type === Markdown.TokenType.HEADING) {
        if (token.depth === VERSION_HEADING_DEPTH) {
          if (token.text !== toVersion && (!fromVersion || token.text === fromVersion)) {
            // We've iterated over everything we needed, stop the loop.
            break;
          }

          currentVersion = token.text === UNPUBLISHED_VERSION_NAME ? 'unpublished' : token.text;
          currentSection = null;

          if (!versions[currentVersion]) {
            versions[currentVersion] = {};
          }
        } else if (currentVersion && token.depth === CHANGE_TYPE_HEADING_DEPTH) {
          currentSection = token.text;

          if (!versions[currentVersion][currentSection]) {
            versions[currentVersion][currentSection] = [];
          }
        }
        continue;
      }

      if (currentVersion && currentSection && token.type === Markdown.TokenType.LIST_ITEM_START) {
        i++;
        for (; tokens[i].type !== Markdown.TokenType.LIST_ITEM_END; i++) {
          const token = tokens[i] as Markdown.TextToken;

          if (token.text) {
            changes.totalCount++;
            versions[currentVersion][currentSection].push(token.text);
          }
        }
      }
    }
    return changes;
  }

  async addChangesAsync(
    entry: ChangelogNewEntry,
    toVersion: string = UNPUBLISHED_VERSION_NAME
  ): Promise<void> {
    const tokens = [...(await this.getTokensAsync())];
    const sectionIndex = tokens.findIndex(
      token =>
        token.type === Markdown.TokenType.HEADING &&
        token.depth === VERSION_HEADING_DEPTH &&
        token.text === toVersion
    );
    if (sectionIndex === -1) {
      throw new Error(`Version ${toVersion} not found.`);
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
        const newTokens: Markdown.Tokens = [
          {
            type: Markdown.TokenType.LIST_ITEM_START,
            loose: false,
            task: false,
          },
          {
            type: Markdown.TokenType.PARAGRAPH,
            text: `${message} ([#${entry.pullRequest}](http://github.com/expo/expo/pull/${entry.pullRequest}) by [@${entry.author}](http://github.com/${entry.author}))`,
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

  async cutOffAsync(version: string): Promise<void> {
    const tokens = [...(await this.getTokensAsync())];
    const firstVersionHeadingIndex = tokens.findIndex(
      token => token.type === Markdown.TokenType.HEADING && token.depth === VERSION_HEADING_DEPTH
    );
    const newSectionTokens: Markdown.Tokens = [
      {
        type: Markdown.TokenType.HEADING,
        depth: VERSION_HEADING_DEPTH,
        text: UNPUBLISHED_VERSION_NAME,
      },
      {
        type: Markdown.TokenType.HEADING,
        depth: CHANGE_TYPE_HEADING_DEPTH,
        text: ChangeType.BREAKING_CHANGES,
      },
      {
        type: Markdown.TokenType.HEADING,
        depth: CHANGE_TYPE_HEADING_DEPTH,
        text: ChangeType.NEW_FEATURES,
      },
      {
        type: Markdown.TokenType.HEADING,
        depth: CHANGE_TYPE_HEADING_DEPTH,
        text: ChangeType.BUG_FIXES,
      },
    ];

    if (firstVersionHeadingIndex !== -1) {
      (tokens[firstVersionHeadingIndex] as Markdown.HeadingToken).text = version;
    }

    tokens.splice(firstVersionHeadingIndex, 0, ...newSectionTokens);
    await fs.outputFile(this.filePath, Markdown.parse(tokens));

    // Reset cached tokens as we just modified the file.
    // We could use an array with new tokens here, but just for safety, let them be reloaded.
    this.tokens = null;
  }
}

/**
 * Convenient method creating `Changelog` instance.
 */
export function loadFrom(path: string): Changelog {
  return new Changelog(path);
}
