import fs from 'fs-extra';
import semver from 'semver';

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

export const VERSION_EMPTY_PARAGRAPH_TEXT =
  '*This version does not introduce any user-facing changes.*';

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

  /**
   * Resolves to `true` if changelog file exists, `false` otherwise.
   */
  async fileExistsAsync(): Promise<boolean> {
    return await fs.pathExists(this.filePath);
  }

  /**
   * Lexifies changelog content and returns resulting tokens.
   */
  async getTokensAsync(): Promise<Markdown.Tokens> {
    if (!this.tokens) {
      try {
        await fs.access(this.filePath, fs.constants.R_OK);
        this.tokens = Markdown.lexify(await fs.readFile(this.filePath, 'utf8'));
      } catch (error) {
        this.tokens = [];
      }
    }
    return this.tokens;
  }

  /**
   * Reads versions headers, collects those versions and returns them.
   */
  async getVersionsAsync(): Promise<string[]> {
    const tokens = await this.getTokensAsync();
    const versionTokens = tokens.filter(
      (token) => token.type === Markdown.TokenType.HEADING && token.depth === VERSION_HEADING_DEPTH
    ) as Markdown.HeadingToken[];

    return versionTokens.map((token) => token.text);
  }

  /**
   * Returns the last version in changelog.
   */
  async getLastPublishedVersionAsync(): Promise<string | null> {
    const versions = await this.getVersionsAsync();
    return versions.find((version) => semver.valid(version)) ?? null;
  }

  /**
   * Reads changes between two given versions and returns them in JS object format.
   * If called without params, then only unpublished changes are returned.
   */
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

  /**
   * Inserts given entry to changelog.
   */
  async addChangeAsync(entry: ChangelogEntry): Promise<void> {
    const tokens = [...(await this.getTokensAsync())];
    const sectionIndex = tokens.findIndex(
      (token) =>
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
          .map(
            (pullRequest) => `[#${pullRequest}](https://github.com/expo/expo/pull/${pullRequest})`
          )
          .join(', ');

        const authors = entry.authors
          .map((author) => `[@${author}](https://github.com/${author})`)
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

  /**
   * Renames header of unpublished changes to given version and adds new section with unpublished changes on top.
   */
  async cutOffAsync(version: string): Promise<void> {
    const tokens = [...(await this.getTokensAsync())];
    const firstVersionHeadingIndex = tokens.findIndex(isVersionToken);
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
      // Set version of the first found version header.
      (tokens[firstVersionHeadingIndex] as Markdown.HeadingToken).text = version;

      // Clean up empty sections.
      let i = firstVersionHeadingIndex + 1;
      while (i < tokens.length && !isVersionToken(tokens[i])) {
        // Remove change type token if its section is empty - when it is followed by another heading token.
        if (isChangeTypeToken(tokens[i])) {
          const nextToken = tokens[i + 1];
          if (!nextToken || isChangeTypeToken(nextToken) || isVersionToken(nextToken)) {
            tokens.splice(i, 1);
            continue;
          }
        }
        i++;
      }

      // `i` stayed the same after removing empty change type sections, so the entire version is empty.
      // Let's put an information that this version doesn't contain any user-facing changes.
      if (i === firstVersionHeadingIndex + 1) {
        tokens.splice(i, 0, {
          type: Markdown.TokenType.PARAGRAPH,
          text: VERSION_EMPTY_PARAGRAPH_TEXT,
        });
      }
    }

    // Insert new tokens before first version header.
    tokens.splice(firstVersionHeadingIndex, 0, ...newSectionTokens);

    // Parse tokens and write result to the file.
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

/**
 * Checks whether given token is interpreted as a token with a version.
 */
function isVersionToken(token: Markdown.Token): boolean {
  return (
    token && token.type === Markdown.TokenType.HEADING && token.depth === VERSION_HEADING_DEPTH
  );
}

/**
 * Checks whether given token is interpreted as a token with a change type.
 */
function isChangeTypeToken(token: Markdown.Token): boolean {
  return (
    token && token.type === Markdown.TokenType.HEADING && token.depth === CHANGE_TYPE_HEADING_DEPTH
  );
}
