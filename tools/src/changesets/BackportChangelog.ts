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
};

export type BackportChangelogResult = {
  ok: boolean;
  errors: string[];
};

const REGULAR_FILE_MODE = '100644';

/** Byte for byte as the `CHANGELOG.md` files on `sdk-*` branches write them. */
const SUBSECTION_HEADINGS = [
  '### 🛠 Breaking changes',
  '### 🎉 New features',
  '### 🐛 Bug fixes',
  '### 💡 Others',
];

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

  const changesetsByPackage = new Map<string, string[]>();
  for (const changeset of input.changesets) {
    try {
      for (const release of parseChangesetFile(changeset.content).releases) {
        const paths = changesetsByPackage.get(release.name) ?? [];
        changesetsByPackage.set(release.name, [...paths, changeset.path]);
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message.split('\n')[0] : String(error);
      errors.push(
        `${changeset.path} cannot be parsed (${reason}), so the packages it names are unknown. Convert this backport by hand.`
      );
    }
  }

  const changelogs: Changelog[] = [];
  for (const [packageName, changesetPaths] of changesetsByPackage) {
    const packageDir = input.packageDirs.get(packageName);
    const duplicateDirs = input.duplicatePackageDirs?.get(packageName);
    if (duplicateDirs) {
      errors.push(
        `More than one package is named "${packageName}" on this branch (${[...duplicateDirs].sort().join(', ')}), so the check cannot tell which CHANGELOG.md belongs to it. Convert this backport by hand.`
      );
    } else if (packageDir === undefined) {
      errors.push(
        `The package "${packageName}", named by ${changesetPaths.join(', ')}, does not exist on this branch. Convert this backport by hand.`
      );
    } else {
      changelogs.push({
        path: path.posix.join(packageDir, 'CHANGELOG.md'),
        packageName,
        changesetPaths,
      });
    }
  }

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

  const trailer = `([#${input.prNumber}](https://github.com/expo/expo/pull/${input.prNumber}) by [@${input.author}](https://github.com/${input.author}))`;
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
  const unpublished = lines.findIndex((line) => /^## Unpublished\s*$/.test(line));
  if (unpublished === -1) {
    return addedBlocks.length > 0
      ? [`${filePath} has no "## Unpublished" section. Convert this changelog by hand.`]
      : [];
  }
  const nextSection = lines.findIndex(
    (line, index) => index > unpublished && line.startsWith('## ')
  );
  const sectionEnd = nextSection === -1 ? lines.length : nextSection;

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
  return { removedLines, addedBlocks };
}

/** Splits on `\n` only, so that a rewrite to CRLF line endings counts as removed lines. */
function splitLines(text: string): string[] {
  return text === '' ? [] : text.split('\n');
}
