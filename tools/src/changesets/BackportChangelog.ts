import { parseChangesetFile } from '@changesets/parse';
import { diffArrays } from 'diff';
import path from 'node:path';

export type BackportChangeset = {
  /** Repo-relative path, such as `.changeset/expo-constants-app-config-path-space.md`. */
  path: string;
  content: string;
};

/** `mode` is the git file mode after the change, such as `100644` or `120000` for a symlink. */
export type BackportChangedFile =
  | { status: 'added'; path: string; mode: string; after: string }
  | { status: 'modified'; path: string; mode: string; before: string; after: string }
  | { status: 'deleted'; path: string; before: string };

export type BackportChangelogInput = {
  /** The changesets that the cherry-picked commit added. */
  changesets: BackportChangeset[];
  /** Every file that the conversion changed, with repo-relative paths. */
  changedFiles: BackportChangedFile[];
  /** The number of the original pull request on `main`. */
  prNumber: number;
  /** The GitHub login of the original pull request's author. */
  author: string;
  /** Maps each package name on the target branch to its repo-relative directory. */
  packageDirs: ReadonlyMap<string, string>;
  /** Maps each package name that more than one package on the target branch uses to those directories. */
  duplicatePackageDirs?: ReadonlyMap<string, readonly string[]>;
  /** Each `package.json` on the target branch that does not parse or has no name. */
  unreadablePackageJsonPaths?: readonly string[];
};

/** A package that a changeset names. `changelog` is null when the target branch has no single package with that name. */
export type BackportPackage = {
  name: string;
  changelog: string | null;
  /** The changesets that name this package. Each one needs its own entry. */
  changesetPaths: string[];
};

export type BackportChangelogResult = {
  ok: boolean;
  errors: string[];
};

export type BackportChangesetConversionInput = {
  /** The changesets that the cherry-picked commit added. */
  changesets: readonly BackportChangeset[];
  /** The packages that `resolveBackportPackages` found for these changesets. */
  packages: readonly BackportPackage[];
  /** The content of the `CHANGELOG.md` of each package, by repo-relative path. */
  changelogs: ReadonlyMap<string, string>;
  /** The number of the original pull request on `main`. */
  prNumber: number;
  /** The GitHub login of the original pull request's author. */
  author: string;
};

export type BackportChangesetConversion = {
  ok: boolean;
  errors: string[];
  /** The new content of each `CHANGELOG.md` that gets an entry, by repo-relative path. Empty when `ok` is false. */
  changelogs: Map<string, string>;
};

type ReleaseType = ReturnType<typeof parseChangesetFile>['releases'][number]['type'];

const REGULAR_FILE_MODE = '100644';

/** Byte for byte as the `CHANGELOG.md` files on `sdk-*` branches write them. */
const SUBSECTION_HEADINGS = [
  '### 🛠 Breaking changes',
  '### 🎉 New features',
  '### 🐛 Bug fixes',
  '### 💡 Others',
];

/** A `major` release has no section: an SDK branch must not ship a breaking change. */
const SECTION_BY_RELEASE_TYPE: Partial<Record<ReleaseType, string>> = {
  minor: '### 🎉 New features',
  patch: '### 💡 Others',
  none: '### 💡 Others',
};

const MAX_LISTED_PATHS = 10;
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/g;

type Changelog = {
  path: string;
  packageName: string;
  /** The changesets that name this package. Each one needs its own entry. */
  changesetPaths: string[];
};

type AddedBlock = {
  /** 0-based index of the first added line in the new content. */
  start: number;
  lines: string[];
};

type RemovedLine = {
  /** 1-based line number in the old content. */
  lineNumber: number;
  text: string;
};

/**
 * Checks that the changesets a cherry-picked commit added to an `sdk-*` branch were converted into
 * `## Unpublished` entries in the `CHANGELOG.md` of each package they name, and deleted.
 */
export function checkBackportChangelog(input: BackportChangelogInput): BackportChangelogResult {
  const errors: string[] = [];
  const changedFiles = new Map(input.changedFiles.map((file) => [file.path, file]));
  const changesetPaths = new Set(input.changesets.map((changeset) => changeset.path));

  for (const changeset of input.changesets) {
    if (changedFiles.get(changeset.path)?.status !== 'deleted') {
      errors.push(
        `${changeset.path} is not deleted. Delete each changeset after you move its summary into CHANGELOG.md.`
      );
    }
  }

  const resolved = resolveBackportPackages(input);
  errors.push(...resolved.errors);
  const changelogs: Changelog[] = resolved.packages.flatMap(({ name, changelog, changesetPaths }) =>
    changelog === null ? [] : [{ path: changelog, packageName: name, changesetPaths }]
  );

  const changelogPaths = new Set(changelogs.map((changelog) => changelog.path));
  for (const file of input.changedFiles) {
    if (!changesetPaths.has(file.path) && !changelogPaths.has(file.path)) {
      errors.push(
        `${file.path} is ${file.status}, but the conversion may only change the CHANGELOG.md of the packages that the changesets name. Revert this change.`
      );
    }
    if (file.status !== 'deleted' && file.mode !== REGULAR_FILE_MODE) {
      errors.push(
        `${file.path} has file mode ${file.mode}. The conversion may only write regular files with mode ${REGULAR_FILE_MODE}. Replace it with a regular file.`
      );
    }
  }

  const trailer = backportTrailer(input.prNumber, input.author);
  for (const changelog of changelogs) {
    const file = changedFiles.get(changelog.path);
    if (!file) {
      errors.push(
        `${changelog.path} has no changes, but "${changelog.packageName}" is named by ${changelog.changesetPaths.join(', ')}. Add an entry for the change under "## Unpublished" in that file.`
      );
      continue;
    }
    const before = file.status === 'added' ? '' : file.before;
    const after = file.status === 'deleted' ? '' : file.after;
    errors.push(...checkChangelog(changelog, before, after, trailer));
  }

  return { ok: errors.length === 0, errors };
}

/**
 * Reads the packages that the changesets name, and finds the `CHANGELOG.md` of each one on the
 * target branch. The check and `et list-backport-changesets` both use it, so the files that the
 * conversion edits are the files that the check expects.
 */
export function resolveBackportPackages(
  input: Pick<
    BackportChangelogInput,
    'changesets' | 'packageDirs' | 'duplicatePackageDirs' | 'unreadablePackageJsonPaths'
  >
): { packages: BackportPackage[]; errors: string[] } {
  const errors: string[] = [];
  const changesetsByPackage = new Map<string, string[]>();
  for (const changeset of input.changesets) {
    try {
      for (const release of parseChangesetFile(changeset.content).releases) {
        const paths = changesetsByPackage.get(release.name) ?? [];
        changesetsByPackage.set(release.name, [...paths, changeset.path]);
      }
    } catch (error) {
      errors.push(unparsableChangesetError(changeset.path, error));
    }
  }

  const packages = [...changesetsByPackage].flatMap(([name, changesetPaths]): BackportPackage[] => {
    const shownName = escapeControlCharacters(name);
    if (shownName !== name) {
      errors.push(
        `${changesetPaths.join(', ')} names the package "${shownName}", which has a control character, so it is not a valid package name. Correct the changeset.`
      );
      // The name cannot go into the list: a reader that splits on control characters would read it wrong.
      return [];
    }
    const packageDir = input.packageDirs.get(name);
    const duplicateDirs = input.duplicatePackageDirs?.get(name);
    if (duplicateDirs) {
      errors.push(
        `More than one package is named "${name}" on this branch (${[...duplicateDirs].sort().join(', ')}), so the check cannot tell which CHANGELOG.md belongs to it.`
      );
    } else if (packageDir === undefined) {
      errors.push(
        missingPackageError(name, changesetPaths, input.unreadablePackageJsonPaths ?? [])
      );
    } else {
      return [{ name, changelog: path.posix.join(packageDir, 'CHANGELOG.md'), changesetPaths }];
    }
    return [{ name, changelog: null, changesetPaths }];
  });
  return { packages, errors };
}

/**
 * Reports each package that a changeset releases as `major`. The `.changeset/expo.json` of an SDK
 * branch does not allow a major release. A changeset that cannot be parsed is skipped:
 * `resolveBackportPackages` reports it.
 */
export function majorReleaseErrors(changesets: readonly BackportChangeset[]): string[] {
  return changesets.flatMap((changeset) =>
    parseReleasesOrNone(changeset.content)
      .filter((release) => release.type === 'major')
      .map((release) => majorReleaseError(changeset.path, release.name))
  );
}

/**
 * Adds one entry under `## Unpublished` to the `CHANGELOG.md` of each package that each changeset
 * releases, in the subsection for its release type. With the changesets deleted, the result passes
 * `checkBackportChangelog`. When any entry cannot be added, no `CHANGELOG.md` changes.
 */
export function convertBackportChangesets(
  input: BackportChangesetConversionInput
): BackportChangesetConversion {
  const trailer = backportTrailer(input.prNumber, input.author);
  const changelogPaths = new Map(input.packages.map((pkg) => [pkg.name, pkg.changelog]));
  const changelogs = new Map<string, string>();
  const errors = new Set<string>();

  for (const changeset of input.changesets) {
    let parsed: ReturnType<typeof parseChangesetFile>;
    try {
      parsed = parseChangesetFile(changeset.content);
    } catch (error) {
      errors.add(unparsableChangesetError(changeset.path, error));
      continue;
    }
    if (parsed.releases.length === 0) {
      continue;
    }
    const entry = formatEntry(parsed.summary, trailer);
    if (typeof entry === 'string') {
      errors.add(`${changeset.path} ${entry}`);
      continue;
    }

    for (const release of parsed.releases) {
      const section = SECTION_BY_RELEASE_TYPE[release.type];
      const changelogPath = changelogPaths.get(release.name) ?? null;
      const changelog =
        changelogPath === null
          ? undefined
          : (changelogs.get(changelogPath) ?? input.changelogs.get(changelogPath));
      if (!section) {
        errors.add(majorReleaseError(changeset.path, release.name));
      } else if (changelogPath === null || changelog === undefined) {
        errors.add(
          `The CHANGELOG.md of "${escapeControlCharacters(release.name)}", named by ${changeset.path}, was not found, so its entry cannot be added. Add the entry by hand.`
        );
      } else {
        const updated = addEntry(changelog, section, entry);
        if (updated === null) {
          errors.add(
            `${changelogPath} has no "## Unpublished" section, so its entries cannot be added. Add the entries by hand under a new "## Unpublished" section at the top of the file.`
          );
        } else {
          changelogs.set(changelogPath, updated);
        }
      }
    }
  }

  return errors.size > 0
    ? { ok: false, errors: [...errors], changelogs: new Map() }
    : { ok: true, errors: [], changelogs };
}

function backportTrailer(prNumber: number, author: string): string {
  return `([#${prNumber}](https://github.com/expo/expo/pull/${prNumber}) by [@${author}](https://github.com/${author}))`;
}

function unparsableChangesetError(changesetPath: string, error: unknown): string {
  const reason = error instanceof Error ? error.message.split('\n')[0] : String(error);
  return `${changesetPath} cannot be parsed (${reason}), so the packages it names are unknown.`;
}

function majorReleaseError(changesetPath: string, packageName: string): string {
  return `${changesetPath} makes a major release of "${escapeControlCharacters(packageName)}", but an SDK branch must not ship a breaking change. Do not backport this pull request, or, if the change is not breaking, backport it by hand as a minor or patch change.`;
}

/**
 * Returns the lines of the entry for `summary`, or, when it cannot be an entry, the reason. The
 * trailer goes on the last line, or on its own line after a closing fence, which it must not follow.
 */
function formatEntry(summary: string, trailer: string): string[] | string {
  if (summary.trim() === '') {
    return 'has no summary, so there is no text for its CHANGELOG.md entries. Add the entries by hand.';
  }
  const lines = summary
    .trim()
    .split(/\r\n?|\n/)
    .map((line, index) => (index === 0 ? `- ${line}` : line.trim() === '' ? '' : `  ${line}`));
  const fenceBeforeLast = openFenceInEntry(lines.slice(0, -1));
  const last = lines.length - 1;
  if (openFenceInEntry(lines) !== null) {
    return 'has a code block that does not close, so its summary cannot be a CHANGELOG.md entry. Add the entries by hand, and close the code block.';
  }
  if (fenceBeforeLast !== null) {
    return [...lines, '', `  ${trailer}`];
  }
  lines[last] += ` ${trailer}`;
  return lines;
}

/** Adds `entry` after the last entry of `section` in `## Unpublished`, or returns null when there is no `## Unpublished`. */
function addEntry(changelog: string, section: string, entry: string[]): string | null {
  const lines = splitLines(changelog);
  const unpublished = findUnpublishedSection(lines);
  if (!unpublished) {
    return null;
  }
  const findInUnpublished = (predicate: (line: string) => boolean) =>
    lines.findIndex(
      (line, index) => index > unpublished.heading && index < unpublished.end && predicate(line)
    );

  const heading = findInUnpublished((line) => line === section);
  if (heading !== -1) {
    let sectionEnd = heading + 1;
    while (sectionEnd < unpublished.end && !/^#{1,6}\s/.test(lines[sectionEnd])) {
      sectionEnd++;
    }
    const last = lastNonBlankLine(lines, heading, sectionEnd);
    insertLines(lines, last + 1, entry, last === heading);
  } else {
    const rank = SUBSECTION_HEADINGS.indexOf(section);
    const nextHeading = findInUnpublished((line) => SUBSECTION_HEADINGS.indexOf(line) > rank);
    const index =
      nextHeading !== -1
        ? nextHeading
        : lastNonBlankLine(lines, unpublished.heading, unpublished.end) + 1;
    insertLines(lines, index, [section, '', ...entry], true);
  }
  return lines.join('\n');
}

/** The index of the last non-blank line after `start` and before `end`, or `start` when there is none. */
function lastNonBlankLine(lines: string[], start: number, end: number): number {
  let index = end - 1;
  while (index > start && lines[index].trim() === '') {
    index--;
  }
  return index;
}

/** Inserts `block` at `index` with a blank line below it, and with a blank line above it if `separate`. */
function insertLines(lines: string[], index: number, block: string[], separate: boolean): void {
  const above = separate && index > 0 && lines[index - 1].trim() !== '' ? [''] : [];
  const below = index >= lines.length || lines[index].trim() !== '' ? [''] : [];
  lines.splice(index, 0, ...above, ...block, ...below);
}

function parseReleasesOrNone(content: string) {
  try {
    return parseChangesetFile(content).releases;
  } catch {
    return [];
  }
}

function escapeControlCharacters(text: string): string {
  return text.replace(
    CONTROL_CHARACTERS,
    (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`
  );
}

/** A `package.json` without a readable name can belong to the missing package, so the error names those files. */
function missingPackageError(
  name: string,
  changesetPaths: string[],
  unreadablePaths: readonly string[]
): string {
  const missing = `The package "${name}", named by ${changesetPaths.join(', ')}, does not exist on this branch.`;
  if (unreadablePaths.length === 0) {
    return missing;
  }
  const shown = [...unreadablePaths].sort().slice(0, MAX_LISTED_PATHS);
  const more =
    unreadablePaths.length > shown.length
      ? `, and ${unreadablePaths.length - shown.length} more`
      : '';
  return `${missing} These package.json files do not parse or have no name, so one of them can be "${name}": ${shown.join(', ')}${more}. Correct that package.json.`;
}

function checkChangelog(
  changelog: Changelog,
  before: string,
  after: string,
  trailer: string
): string[] {
  const filePath = changelog.path;
  const errors: string[] = [];
  const afterLines = splitLines(after);
  const { removedLines, addedBlocks } = diffLines(splitLines(before), afterLines);

  if (removedLines.length > 0) {
    const [first] = removedLines;
    errors.push(
      `${filePath} removes or edits ${removedLines.length} existing line(s), the first at line ${first.lineNumber}: "${first.text}". The conversion may only add lines. Restore the original lines.`
    );
  }

  for (const block of addedBlocks) {
    const offset = block.lines.findIndex((line) => line.includes('\r'));
    if (offset !== -1) {
      errors.push(
        `${filePath} line ${block.start + offset + 1} contains a carriage return. Use LF line endings only.`
      );
      break;
    }
  }

  const addedLines = new Set(
    addedBlocks.flatMap((block) => block.lines.map((_, offset) => block.start + offset))
  );
  errors.push(...checkPlacement(filePath, afterLines, addedBlocks, addedLines));
  errors.push(...checkSubsections(filePath, afterLines, addedLines));
  errors.push(...checkSplitEntries(filePath, afterLines, addedBlocks, addedLines));

  let entryCount = 0;
  for (const block of addedBlocks) {
    const result = checkEntries(filePath, block, trailer);
    entryCount += result.entryCount;
    errors.push(...result.errors);
  }
  const requiredCount = changelog.changesetPaths.length;
  if (entryCount === 0) {
    errors.push(
      `${filePath} adds no entry. Add one "- " entry for the change under a "###" subsection of "## Unpublished".`
    );
  } else if (entryCount < requiredCount) {
    errors.push(
      `${filePath} adds ${entryCount} ${entryCount === 1 ? 'entry' : 'entries'}, but ${requiredCount} changesets name "${changelog.packageName}" (${changelog.changesetPaths.join(', ')}). Add one entry for each changeset.`
    );
  }
  return errors;
}

function checkPlacement(
  filePath: string,
  lines: string[],
  addedBlocks: AddedBlock[],
  addedLines: ReadonlySet<number>
): string[] {
  const section = findUnpublishedSection(lines);
  if (!section) {
    return addedBlocks.length > 0
      ? [`${filePath} has no "## Unpublished" section. Convert this changelog by hand.`]
      : [];
  }
  const { heading: unpublished, end: sectionEnd } = section;

  const errors: string[] = [];
  for (const block of addedBlocks) {
    const blockEnd = block.start + block.lines.length;
    if (block.start <= unpublished || blockEnd > sectionEnd) {
      const firstOutside =
        block.start <= unpublished ? block.start : Math.max(block.start, sectionEnd);
      errors.push(
        `${filePath} line ${firstOutside + 1} is outside the "## Unpublished" section. Move the entry under a "###" subsection of "## Unpublished".`
      );
      continue;
    }
    for (let index = block.start; index < blockEnd; index++) {
      if (!lines[index].startsWith('- ')) {
        continue;
      }
      let heading = index - 1;
      while (heading > unpublished && !/^#{1,6}\s/.test(lines[heading])) {
        heading--;
      }
      if (heading === unpublished) {
        errors.push(
          `${filePath} line ${index + 1} is in "## Unpublished" but not under a "###" subsection. Move the entry under the subsection that fits it, such as "### 🐛 Bug fixes".`
        );
        break;
      }
      // An added heading that is not allowed is already reported by `checkEntries`.
      if (!SUBSECTION_HEADINGS.includes(lines[heading]) && !addedLines.has(heading)) {
        errors.push(
          `${filePath} line ${index + 1} is under the heading "${lines[heading]}". Entries may only go under these headings, exactly as written: ${SUBSECTION_HEADINGS.map((name) => `"${name}"`).join(', ')}. Move the entry under the one that fits it.`
        );
        break;
      }
    }
  }
  return errors;
}

/** `heading` is the index of the `## Unpublished` line, and `end` the index of the next `## ` section or the line count. */
function findUnpublishedSection(lines: string[]): { heading: number; end: number } | null {
  const heading = lines.findIndex((line) => /^## Unpublished\s*$/.test(line));
  if (heading === -1) {
    return null;
  }
  const nextSection = lines.findIndex((line, index) => index > heading && line.startsWith('## '));
  return { heading, end: nextSection === -1 ? lines.length : nextSection };
}

/** A heading that the change adds to `## Unpublished` must not repeat a heading or break the order of `SUBSECTION_HEADINGS`. */
function checkSubsections(
  filePath: string,
  lines: string[],
  addedLines: ReadonlySet<number>
): string[] {
  const section = findUnpublishedSection(lines);
  if (!section) {
    return [];
  }
  const headings: { index: number; rank: number }[] = [];
  for (let index = section.heading + 1; index < section.end; index++) {
    const rank = SUBSECTION_HEADINGS.indexOf(lines[index]);
    if (rank !== -1) {
      headings.push({ index, rank });
    }
  }

  const errors: string[] = [];
  // Only a pair with an added heading is the conversion's fault. Other errors, such as a removed
  // `## ` line, already report a change that moves existing headings into the section.
  const outOfOrder = headings.findIndex(
    (heading, i) =>
      i > 0 &&
      heading.rank < headings[i - 1].rank &&
      (addedLines.has(heading.index) || addedLines.has(headings[i - 1].index))
  );
  if (outOfOrder !== -1) {
    const { index } = headings[outOfOrder];
    const previous = headings[outOfOrder - 1];
    errors.push(
      `${filePath} line ${index + 1} has the heading "${lines[index]}" after "${lines[previous.index]}". Keep the subsections of "## Unpublished" in this order: ${SUBSECTION_HEADINGS.map((name) => `"${name}"`).join(', ')}.`
    );
  }
  for (const { index, rank } of headings) {
    const existing = headings.find((other) => other.rank === rank && other.index !== index);
    if (addedLines.has(index) && existing) {
      errors.push(
        `${filePath} line ${index + 1} adds the heading "${lines[index]}", but "## Unpublished" already has it at line ${existing.index + 1}. Add the entry under the existing heading.`
      );
    }
  }
  return errors;
}

/**
 * An existing entry's continuation lines belong to the entry above them. If added lines come
 * between the two, the continuation becomes part of the last added entry instead.
 */
function checkSplitEntries(
  filePath: string,
  lines: string[],
  addedBlocks: AddedBlock[],
  addedLines: ReadonlySet<number>
): string[] {
  const errors: string[] = [];
  for (const block of addedBlocks) {
    if (block.lines.every((line) => line.trim() === '')) {
      continue;
    }
    let next = block.start + block.lines.length;
    while (next < lines.length && lines[next].trim() === '') {
      next++;
    }
    if (next < lines.length && !addedLines.has(next) && /^ {2,}\S/.test(lines[next])) {
      errors.push(
        `${filePath} line ${next + 1} continues an existing entry, but the lines added at line ${block.start + 1} split it from the start of that entry. Add the new entry after the end of the existing entry.`
      );
    }
  }
  return errors;
}

/**
 * An entry is a `- ` line followed by lines indented by at least two spaces. Blank lines may appear
 * anywhere in a block, because they separate paragraphs and entries. A block may also add one of
 * the `SUBSECTION_HEADINGS`, for a subsection that `## Unpublished` does not have yet.
 */
function checkEntries(
  filePath: string,
  block: AddedBlock,
  trailer: string
): { entryCount: number; errors: string[] } {
  const errors: string[] = [];
  let entryCount = 0;
  let entry: { lineNumber: number; text: string[] } | null = null;

  const finishEntry = () => {
    if (entry) {
      const text = entry.text.join(' ');
      if (!text.endsWith(` ${trailer}`)) {
        errors.push(
          `${filePath} entry at line ${entry.lineNumber} does not end with "${trailer}". End the entry with this trailer, which names the original pull request and its author.`
        );
      } else if (text.slice('- '.length, -trailer.length).trim() === '') {
        errors.push(
          `${filePath} entry at line ${entry.lineNumber} has no text before the trailer. Describe the change before the trailer, as the changeset summary does.`
        );
      }
      if (openFenceInEntry(entry.text) !== null) {
        errors.push(
          `${filePath} entry at line ${entry.lineNumber} has a code block that does not close. Keep the closing fence of the summary unchanged, and put the trailer on its own line after the code block.`
        );
      }
    }
    entry = null;
  };

  block.lines.forEach((line, offset) => {
    const lineNumber = block.start + offset + 1;
    if (line.trim() === '') {
      return;
    }
    if (line.startsWith('- ')) {
      finishEntry();
      entry = { lineNumber, text: [line.trim()] };
      entryCount++;
    } else if (/^ {2,}\S/.test(line) && entry) {
      entry.text.push(line.trim());
    } else if (/^ {2,}\S/.test(line)) {
      errors.push(
        `${filePath} line ${lineNumber} continues an entry that this change did not add. Do not edit existing entries; add a new "- " entry instead.`
      );
    } else if (SUBSECTION_HEADINGS.includes(line)) {
      finishEntry();
    } else if (line.startsWith('#')) {
      finishEntry();
      errors.push(
        `${filePath} line ${lineNumber} adds the heading "${line}". The conversion may only add these headings, exactly as written: ${SUBSECTION_HEADINGS.map((heading) => `"${heading}"`).join(', ')}. Put the entry under one of them.`
      );
    } else {
      finishEntry();
      errors.push(
        `${filePath} line ${lineNumber} does not start with "- ". Start each entry with "- ", and indent its continuation lines by two spaces.`
      );
    }
  });
  finishEntry();

  return { entryCount, errors };
}

/** A code block can start on the first line of an entry, after its `- ` list marker. */
function openFenceInEntry(lines: readonly string[]): string | null {
  return lines
    .map((line, index) => (index === 0 ? line.trim().replace(/^- /, '') : line.trim()))
    .reduce(openFenceAfter, null);
}

/**
 * Returns the fence of the code block that is open after the trimmed `line`, or `null`. As in
 * CommonMark, a closing fence uses the same character as the opening fence, is at least as long,
 * and has nothing else on the line.
 */
function openFenceAfter(openFence: string | null, line: string): string | null {
  const fence = /^(`{3,}|~{3,})/.exec(line)?.[1] ?? null;
  if (openFence === null) {
    return fence;
  }
  const closes = fence === line && fence[0] === openFence[0] && fence.length >= openFence.length;
  return closes ? null : openFence;
}

function diffLines(
  before: string[],
  after: string[]
): { removedLines: RemovedLine[]; addedBlocks: AddedBlock[] } {
  const removedLines: RemovedLine[] = [];
  const addedBlocks: AddedBlock[] = [];
  let beforeIndex = 0;
  let afterIndex = 0;

  for (const change of diffArrays(before, after)) {
    if (change.added) {
      const previous = addedBlocks.at(-1);
      if (previous && previous.start + previous.lines.length === afterIndex) {
        previous.lines.push(...change.value);
      } else {
        addedBlocks.push({ start: afterIndex, lines: [...change.value] });
      }
      afterIndex += change.value.length;
    } else if (change.removed) {
      change.value.forEach((text, offset) => {
        removedLines.push({ lineNumber: beforeIndex + offset + 1, text });
      });
      beforeIndex += change.value.length;
    } else {
      beforeIndex += change.value.length;
      afterIndex += change.value.length;
    }
  }
  return { removedLines, addedBlocks: joinSplitEntries(addedBlocks, after) };
}

/**
 * The diff can match a blank line inside a new entry to an existing blank line, which splits the
 * entry into two blocks. Joins a block that starts with an indented continuation line to the block
 * before it when only blank lines are between them.
 */
function joinSplitEntries(blocks: AddedBlock[], after: string[]): AddedBlock[] {
  const joined: AddedBlock[] = [];
  for (const block of blocks) {
    const previous = joined.at(-1);
    if (previous && /^ {2,}\S/.test(block.lines[0])) {
      const gap = after.slice(previous.start + previous.lines.length, block.start);
      if (gap.every((line) => line === '')) {
        previous.lines.push(...gap, ...block.lines);
        continue;
      }
    }
    joined.push(block);
  }
  return joined;
}

/** Splits on `\n` only, so that a rewrite to CRLF line endings counts as removed lines. */
function splitLines(text: string): string[] {
  return text === '' ? [] : text.split('\n');
}
