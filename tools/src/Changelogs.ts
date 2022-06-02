import assert from 'assert';
import fs from 'fs-extra';
import semver from 'semver';

import * as Markdown from './Markdown';
import { execAll } from './Utils';

/**
 * Type of the objects representing single changelog entry.
 */
export type ChangelogEntry = {
  /**
   * The change note.
   */
  message: string;
  /**
   * The pull request number.
   */
  pullRequests?: number[];
  /**
   * GitHub's user names of someones who made this change.
   */
  authors?: string[];
};

/**
 * Describes changelog entries under specific version.
 */
export type ChangelogVersionChanges = Record<ChangeType, ChangelogEntry[]>;

/**
 * Type of the objects representing changelog entries.
 */
export type ChangelogChanges = {
  totalCount: number;
  versions: Record<string, ChangelogVersionChanges>;

  // {version -> versionDate} map
  versionDateMap: Record<string, string>;
};

/**
 * Represents options object that can be passed to `insertEntriesAsync`.
 */
export type InsertOptions = Partial<{
  unshift: boolean;
}>;

/**
 * Enum with changelog sections that are commonly used by us.
 */
export enum ChangeType {
  /**
   * Upgrading vendored libs.
   */
  LIBRARY_UPGRADES = '📚 3rd party library updates',

  /**
   * Changes in the API that may require users to change their code.
   */
  BREAKING_CHANGES = '🛠 Breaking changes',

  /**
   * New features and non-breaking changes in the API.
   */
  NEW_FEATURES = '🎉 New features',

  /**
   * Bug fixes and inconsistencies with the documentation.
   */
  BUG_FIXES = '🐛 Bug fixes',

  /**
   * Changes that users should be aware of as they cause behavior changes in corner cases.
   */
  NOTICES = '⚠️ Notices',

  /**
   * Anything that doesn't apply to other types.
   */
  OTHERS = '💡 Others',
}

/**
 * Heading name for unpublished changes.
 */
export const UNPUBLISHED_VERSION_NAME = 'Unpublished';

export const VERSION_EMPTY_PARAGRAPH_TEXT =
  '_This version does not introduce any user-facing changes._\n';

/**
 * Depth of headings that mean the version containing following changes.
 */
const VERSION_HEADING_DEPTH = 2;

/**
 * Depth of headings that are being recognized as the type of changes (breaking changes, new features of bugfixes).
 */
const CHANGE_TYPE_HEADING_DEPTH = 3;

/**
 * Depth of the list that can be a group.
 */
const GROUP_LIST_ITEM_DEPTH = 0;

/**
 * Class representing a changelog.
 */
export class Changelog {
  filePath: string;
  tokens: Markdown.Tokens | null = null;

  static textToChangelogEntry(text: string): Required<ChangelogEntry> {
    const pullRequests = execAll(
      /\[#\d+\]\(https?:\/\/github\.com\/expo\/expo\/pull\/(\d+)\)/g,
      text,
      1
    );
    const authors = execAll(/\[@\w+\]\(https?:\/\/github\.com\/([^/)]+)\)/g, text, 1);

    return {
      message: text.trim(),
      pullRequests: pullRequests.map((match) => parseInt(match, 10)),
      authors,
    };
  }

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
        const markdown = await fs.readFile(this.filePath, 'utf8');
        this.tokens = Markdown.lexify(markdown);
      } catch {
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

    return tokens
      .filter((token): token is Markdown.HeadingToken => isVersionToken(token))
      .map((token) => parseVersion(token.text))
      .filter(Boolean) as string[];
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
    const versions: ChangelogChanges['versions'] = {};
    const versionDateMap = {};
    const changes: ChangelogChanges = { totalCount: 0, versions, versionDateMap };

    let currentVersion: string | null = null;
    let currentSection: string | null = null;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (Markdown.isHeadingToken(token)) {
        if (token.depth === VERSION_HEADING_DEPTH) {
          const parsedVersion = parseVersion(token.text);

          if (!parsedVersion) {
            // Token is not a valid version token.
            continue;
          }
          if (parsedVersion !== toVersion && (!fromVersion || parsedVersion === fromVersion)) {
            // We've iterated over everything we needed, stop the loop.
            break;
          }

          currentVersion = parsedVersion;
          currentSection = null;

          if (!versions[currentVersion]) {
            versions[currentVersion] = {} as ChangelogVersionChanges;
          }

          // version format is `{version} - {date}`.
          const currentVersionDate = token.text.substring(parsedVersion.length + 3);
          if (!versionDateMap[currentVersionDate]) {
            versionDateMap[currentVersion] = currentVersionDate;
          }
        } else if (currentVersion && token.depth === CHANGE_TYPE_HEADING_DEPTH) {
          currentSection = token.text;

          if (!versions[currentVersion][currentSection]) {
            versions[currentVersion][currentSection] = [];
          }
        }
        continue;
      }

      if (currentVersion && currentSection && Markdown.isListToken(token)) {
        for (const item of token.items) {
          const text = item.tokens.find(Markdown.isTextToken)?.text ?? item.text;

          changes.totalCount++;
          versions[currentVersion][currentSection].push(Changelog.textToChangelogEntry(text));
        }
      }
    }
    return changes;
  }

  /**
   * Saves changes that we made in the array of tokens.
   */
  async saveAsync(): Promise<void> {
    // If tokens where not loaded yet, there is nothing to save.
    if (!this.tokens) {
      return;
    }

    // Parse cached tokens and write result to the file.
    await fs.outputFile(this.filePath, Markdown.render(this.tokens));

    // Reset cached tokens as we just modified the file.
    // We could use an array with new tokens here, but just for safety, let them be reloaded.
    this.tokens = null;
  }

  /**
   * Inserts given entries under specific version, change type and group.
   * Returns a new array of entries that were successfully inserted (filters out duplicated entries).
   * Throws an error if given version cannot be find in changelog.
   */
  async insertEntriesAsync(
    version: string,
    type: ChangeType | string,
    group: string | null,
    entries: (ChangelogEntry | string)[],
    options: InsertOptions = {}
  ): Promise<ChangelogEntry[]> {
    if (entries.length === 0) {
      return [];
    }

    const tokens = await this.getTokensAsync();
    const sectionIndex = tokens.findIndex((token) => isVersionToken(token, version));

    if (sectionIndex === -1) {
      throw new Error(`Version ${version} not found.`);
    }

    for (let i = sectionIndex + 1; i < tokens.length; i++) {
      if (isVersionToken(tokens[i])) {
        // Encountered another version - so given change type isn't in changelog yet.
        // We create appropriate change type token and insert this version token.
        const changeTypeToken = Markdown.createHeadingToken(type, CHANGE_TYPE_HEADING_DEPTH);
        tokens.splice(i, 0, changeTypeToken);
        // `tokens[i]` is now `changeTypeToken` - so we will jump into `if` below.
      }
      if (isChangeTypeToken(tokens[i], type)) {
        const changeTypeToken = tokens[i] as Markdown.HeadingToken;
        let list: Markdown.ListToken | null = null;
        let j = i + 1;

        // Find the first list token between headings and save it under `list` variable.
        for (; j < tokens.length; j++) {
          const item = tokens[j];
          if (Markdown.isListToken(item)) {
            list = item;
            break;
          }
          if (Markdown.isHeadingToken(item) && item.depth <= changeTypeToken.depth) {
            break;
          }
        }

        // List not found, create new list token and insert it in place where the loop stopped.
        if (!list) {
          list = Markdown.createListToken();
          tokens.splice(j, 0, list);
        }

        // If group name is specified, let's go deeper and find (or create) a list for that group.
        if (group) {
          list = findOrCreateGroupList(list, group);
        }

        const addedEntries: ChangelogEntry[] = [];

        // Iterate over given entries and push them to the list we ended up with.
        for (const entry of entries) {
          const entryObject = typeof entry === 'string' ? { message: entry } : entry;
          const listItemLabel = getChangeEntryLabel(entryObject);

          // Filter out duplicated entries.
          if (!list.items.some((item) => item.text.trim() === listItemLabel.trim())) {
            const listItem = Markdown.createListItemToken(
              listItemLabel,
              group ? GROUP_LIST_ITEM_DEPTH : 0
            );

            if (options.unshift) {
              list.items.unshift(listItem);
            } else {
              list.items.push(listItem);
            }
            addedEntries.push(entryObject);
          }
        }
        return addedEntries;
      }
    }
    throw new Error(`Cound't find '${type}' section.`);
  }

  /**
   * Inserts an `VERSION_EMPTY_PARAGRAPH_TEXT` version section before first published version.
   */
  async insertEmptyPublishedVersionAsync(
    version: string,
    versionDate: string | null
  ): Promise<boolean> {
    const tokens = await this.getTokensAsync();

    const versionIndex = tokens.findIndex((token) => isVersionToken(token, version));
    if (versionIndex !== -1) {
      throw new Error(`Version section ${version} existed.`);
    }

    const firstPublishedVersionHeadingIndex = tokens.findIndex(
      (token) => isVersionToken(token) && !isVersionToken(token, UNPUBLISHED_VERSION_NAME)
    );

    const dateString = versionDate ?? new Date().toISOString().substring(0, 10);
    const newSectionTokens = [
      Markdown.createHeadingToken(`${version} - ${dateString}`, VERSION_HEADING_DEPTH),
      {
        type: Markdown.TokenType.PARAGRAPH,
        text: VERSION_EMPTY_PARAGRAPH_TEXT,
      } as Markdown.ParagraphToken,
    ];

    // Insert new tokens before first publiushed version header.
    tokens.splice(firstPublishedVersionHeadingIndex, 0, ...newSectionTokens);
    return true;
  }

  /**
   * Removes an entry under specific version and change type.
   */
  async removeEntryAsync(
    version: string,
    type: ChangeType | string,
    entry: ChangelogEntry | string
  ): Promise<boolean> {
    const tokens = await this.getTokensAsync();

    const versionIndex = tokens.findIndex((token) => isVersionToken(token, version));
    if (versionIndex === -1) {
      throw new Error(`Version ${version} not found.`);
    }

    const changeTypeIndex = tokens.findIndex(
      (token, i) => i >= versionIndex && isChangeTypeToken(token, type)
    );
    if (changeTypeIndex === -1) {
      throw new Error(`Change type ${type} not found.`);
    }

    const entryText = typeof entry === 'string' ? entry : entry.message;
    for (let i = changeTypeIndex + 1; i < tokens.length; i++) {
      if (isVersionToken(tokens[i]) || isChangeTypeToken(tokens[i])) {
        // Hit other section and stop iteration
        break;
      }

      const token = tokens[i];
      assert(Markdown.isListToken(token));

      for (const [itemIndex, item] of token.items.entries()) {
        const text = (item.tokens.find(Markdown.isTextToken)?.text ?? item.text).trim();
        if (text === entryText) {
          token.items.splice(itemIndex, 1);

          // Remove empty change type section
          if (token.items.length === 0) {
            tokens.splice(i, 1);
          }

          return true;
        }
      }
    }

    return false;
  }

  /**
   * Moves an entry from a version section to another. If no `newVersion` section exists, will create one.
   */
  async moveEntryBetweenVersionsAsync(
    entry: ChangelogEntry | string,
    type: ChangeType | string,
    oldVersion: string,
    newVersion: string,
    newVersionDate: string | null
  ): Promise<boolean> {
    const removed = await this.removeEntryAsync(oldVersion, type, entry);
    if (!removed) {
      return false;
    }

    const tokens = await this.getTokensAsync();
    const versionIndex = tokens.findIndex((token) => isVersionToken(token, newVersion));
    if (versionIndex === -1) {
      // if there's no existing version section, create one.
      const firstPublishedVersionHeadingIndex = tokens.findIndex(
        (token) => isVersionToken(token) && !isVersionToken(token, UNPUBLISHED_VERSION_NAME)
      );

      const dateString = newVersionDate ?? new Date().toISOString().substring(0, 10);
      const newSectionTokens = [
        Markdown.createHeadingToken(`${newVersion} - ${dateString}`, VERSION_HEADING_DEPTH),
        Markdown.createHeadingToken(String(type), CHANGE_TYPE_HEADING_DEPTH),
      ];

      // Insert new tokens before first publiushed version header.
      tokens.splice(firstPublishedVersionHeadingIndex, 0, ...newSectionTokens);
    }

    await this.insertEntriesAsync(newVersion, type, null, [entry]);
    return true;
  }

  /**
   * Renames header of unpublished changes to given version and adds new section with unpublished changes on top.
   */
  async cutOffAsync(
    version: string,
    types: string[] = [
      ChangeType.BREAKING_CHANGES,
      ChangeType.NEW_FEATURES,
      ChangeType.BUG_FIXES,
      ChangeType.OTHERS,
    ]
  ): Promise<void> {
    const tokens = await this.getTokensAsync();
    const firstVersionHeadingIndex = tokens.findIndex((token) => isVersionToken(token));
    const newSectionTokens = [
      Markdown.createHeadingToken(UNPUBLISHED_VERSION_NAME, VERSION_HEADING_DEPTH),
      ...types.map((type) => Markdown.createHeadingToken(type, CHANGE_TYPE_HEADING_DEPTH)),
    ];

    if (firstVersionHeadingIndex !== -1) {
      // Set version of the first found version header and put current date in YYYY-MM-DD format.
      const dateStr = new Date().toISOString().substring(0, 10);
      (tokens[firstVersionHeadingIndex] as Markdown.HeadingToken).text = `${version} — ${dateStr}`;

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
  }

  render() {
    if (!this.tokens) {
      throw new Error('Tokens have not been loaded yet!');
    }
    return Markdown.render(this.tokens);
  }
}

/**
 * Memory based changelog
 */
export class MemChangelog extends Changelog {
  content: string;

  constructor(content: string) {
    super('');
    this.content = content;
  }

  async fileExistsAsync(): Promise<boolean> {
    throw new Error('Unsupported function for MemChangelog.');
  }

  async saveAsync(): Promise<void> {
    throw new Error('Unsupported function for MemChangelog.');
  }

  async getTokensAsync(): Promise<Markdown.Tokens> {
    if (!this.tokens) {
      try {
        this.tokens = Markdown.lexify(this.content);
      } catch {
        this.tokens = [];
      }
    }
    return this.tokens;
  }
}

/**
 * Convenient method creating `Changelog` instance.
 */
export function loadFrom(path: string): Changelog {
  return new Changelog(path);
}

/**
 * Parses given text and returns the first found semver version, or null if none was found.
 * If given text equals to unpublished version name then it's returned.
 */
function parseVersion(text: string): string | null {
  if (text === UNPUBLISHED_VERSION_NAME) {
    return text;
  }
  const match = /(\d+\.\d+\.\d+)([-+][\w\.]+)?/.exec(text);
  return match?.[0] ?? null;
}

/**
 * Parses given text and returns group name if found, null otherwise.
 */
function parseGroup(text: string): string | null {
  const match = /^\*\*`([@\w\-\/]+)`\*\*/.exec(text.trim());
  return match?.[1] ?? null;
}

/**
 * Checks whether given token is interpreted as a token with a version.
 */
function isVersionToken(token: Markdown.Token, version?: string): token is Markdown.HeadingToken {
  return (
    Markdown.isHeadingToken(token) &&
    token.depth === VERSION_HEADING_DEPTH &&
    (!version || token.text === version || parseVersion(token.text) === version)
  );
}

/**
 * Checks whether given token is interpreted as a token with a change type.
 */
function isChangeTypeToken(
  token: Markdown.Token,
  changeType?: ChangeType | string
): token is Markdown.HeadingToken {
  return (
    Markdown.isHeadingToken(token) &&
    token.depth === CHANGE_TYPE_HEADING_DEPTH &&
    (!changeType || token.text === changeType)
  );
}

/**
 * Checks whether given token is interpreted as a list group.
 */
function isGroupToken(token: Markdown.Token, groupName: string): token is Markdown.ListItemToken {
  if (Markdown.isListItemToken(token) && token.depth === GROUP_LIST_ITEM_DEPTH) {
    const firstToken = token.tokens[0];
    return Markdown.isTextToken(firstToken) && parseGroup(firstToken.text) === groupName;
  }
  return false;
}

/**
 * Finds list item that makes a group with given name.
 */
function findOrCreateGroupList(list: Markdown.ListToken, group: string): Markdown.ListToken {
  let groupListItem = list.items.find((item) => isGroupToken(item, group)) ?? null;

  // Group list item not found, create new list item token and add it at the end.
  if (!groupListItem) {
    groupListItem = Markdown.createListItemToken(getGroupLabel(group));
    list.items.push(groupListItem);
  }

  // Find group list among list item tokens.
  let groupList = groupListItem.tokens.find(Markdown.isListToken);

  if (!groupList) {
    groupList = Markdown.createListToken(GROUP_LIST_ITEM_DEPTH);
    groupListItem.tokens.push(groupList);
  }
  return groupList;
}

/**
 * Stringifies change entry object.
 */
export function getChangeEntryLabel(entry: ChangelogEntry): string {
  const pullRequests = entry.pullRequests || [];
  const authors = entry.authors || [];

  if (pullRequests.length + authors.length > 0) {
    const pullRequestsStr = pullRequests
      .map((pullRequest) => `[#${pullRequest}](https://github.com/expo/expo/pull/${pullRequest})`)
      .join(', ');

    const authorsStr = authors
      .map((author) => `[@${author}](https://github.com/${author})`)
      .join(', ');

    const pullRequestInformations = `${pullRequestsStr} by ${authorsStr}`.trim();
    if (entry.message.includes(pullRequestInformations)) {
      return entry.message;
    } else {
      return `${entry.message} (${pullRequestInformations})`;
    }
  }
  return entry.message;
}

/**
 * Converts plain group name to its markdown representation.
 */
function getGroupLabel(groupName: string): string {
  return `**\`${groupName}\`**`;
}
