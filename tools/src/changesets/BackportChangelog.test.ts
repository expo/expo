import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  BackportChangedFile,
  BackportChangelogInput,
  BackportChangeset,
  checkBackportChangelog,
  convertBackportChangesets,
  majorReleaseErrors,
  resolveBackportPackages,
} from './BackportChangelog';

const PR = 51463;
const AUTHOR = 'chrfalch';
const TRAILER = `([#${PR}](https://github.com/expo/expo/pull/${PR}) by [@${AUTHOR}](https://github.com/${AUTHOR}))`;
const SUMMARY =
  '[iOS] Fix a launch crash (`Symbol not found: _swift_allocateMetadataPack`) in apps that use precompiled Expo modules and build with Xcode 27.';
const ENTRY = `- ${SUMMARY} ${TRAILER}`;

const CHANGESET_PATH = '.changeset/jsi-hide-swift-runtime-exports.md';
const CHANGESET_CONTENT = `---
'expo-modules-jsi': patch
'expo-modules-core': patch
---

${SUMMARY}
`;

const CORE_CHANGELOG = 'packages/expo-modules-core/CHANGELOG.md';
const JSI_CHANGELOG = 'packages/expo-modules-jsi/CHANGELOG.md';

const EXISTING_JSI_ENTRY =
  '- [iOS] Fix the `.swiftinterface` failing to compile with Xcode 27 (Swift 6.4). ([#50569](https://github.com/expo/expo/pull/50569) by [@chrfalch](https://github.com/chrfalch))';

function changelog(unpublishedBugFixes: string[]): string {
  return [
    '# Changelog',
    '',
    '## Unpublished',
    '',
    '### 🛠 Breaking changes',
    '',
    '### 🎉 New features',
    '',
    '### 🐛 Bug fixes',
    '',
    ...unpublishedBugFixes,
    '### 💡 Others',
    '',
    '## 57.0.23 — 2026-10-14',
    '',
    '### 🐛 Bug fixes',
    '',
    '- Fix an old bug. ([#50000](https://github.com/expo/expo/pull/50000) by [@tsapeta](https://github.com/tsapeta))',
    '',
  ].join('\n');
}

const CORE_BEFORE = changelog([]);
const JSI_BEFORE = changelog([EXISTING_JSI_ENTRY, '']);

/** Replaces the first line equal to `line` with `replacement`. */
function replaceLine(text: string, line: string, replacement: string[]): string {
  const lines = text.split('\n');
  const index = lines.indexOf(line);
  assert.notEqual(index, -1, `fixture line not found: ${line}`);
  lines.splice(index, 1, ...replacement);
  return lines.join('\n');
}

/** Models the #51463 part of the human conversion in commit 0fa33b8518e on sdk-57. */
function validInput(): BackportChangelogInput {
  return {
    changesets: [{ path: CHANGESET_PATH, content: CHANGESET_CONTENT }],
    changedFiles: [
      { status: 'deleted', path: CHANGESET_PATH, before: CHANGESET_CONTENT },
      {
        status: 'modified',
        mode: '100644',
        path: CORE_CHANGELOG,
        before: CORE_BEFORE,
        after: replaceLine(CORE_BEFORE, '### 💡 Others', [ENTRY, '', '### 💡 Others']),
      },
      {
        status: 'modified',
        mode: '100644',
        path: JSI_CHANGELOG,
        before: JSI_BEFORE,
        after: replaceLine(JSI_BEFORE, EXISTING_JSI_ENTRY, [EXISTING_JSI_ENTRY, ENTRY]),
      },
    ],
    prNumber: PR,
    author: AUTHOR,
    packageDirs: new Map([
      ['expo-modules-core', 'packages/expo-modules-core'],
      ['expo-modules-jsi', 'packages/expo-modules-jsi'],
      ['expo-router', 'packages/expo-router'],
    ]),
  };
}

function withoutFile(input: BackportChangelogInput, path: string): BackportChangelogInput {
  return { ...input, changedFiles: input.changedFiles.filter((file) => file.path !== path) };
}

function withFile(
  input: BackportChangelogInput,
  file: BackportChangedFile
): BackportChangelogInput {
  return {
    ...withoutFile(input, file.path),
    changedFiles: [...withoutFile(input, file.path).changedFiles, file],
  };
}

function withCoreAfter(input: BackportChangelogInput, after: string): BackportChangelogInput {
  return withFile(input, {
    status: 'modified',
    mode: '100644',
    path: CORE_CHANGELOG,
    before: CORE_BEFORE,
    after,
  });
}

function assertSingleError(input: BackportChangelogInput, ...patterns: RegExp[]): void {
  const result = checkBackportChangelog(input);
  assert.equal(result.ok, false);
  assert.equal(result.errors.length, 1, `expected one error, got:\n${result.errors.join('\n')}`);
  for (const pattern of patterns) {
    assert.match(result.errors[0], pattern);
  }
}

function assertSomeError(input: BackportChangelogInput, ...patterns: RegExp[]): void {
  const result = checkBackportChangelog(input);
  assert.equal(result.ok, false);
  assert.ok(
    result.errors.some((error) => patterns.every((pattern) => pattern.test(error))),
    `no error matches ${patterns.join(' and ')}, got:\n${result.errors.join('\n')}`
  );
}

describe('checkBackportChangelog', () => {
  it('accepts a conversion like the human one in 0fa33b8518e', () => {
    assert.deepEqual(checkBackportChangelog(validInput()), { ok: true, errors: [] });
  });

  it('accepts a scoped package and a multi-paragraph entry with indented continuation lines', () => {
    const changesetPath = '.changeset/config-plugins-xcode-4.md';
    const changesetContent =
      "---\n'@expo/config-plugins': patch\n---\n\nFirst paragraph.\n\nSecond paragraph.\n";
    const changelogPath = 'packages/@expo/config-plugins/CHANGELOG.md';
    const result = checkBackportChangelog({
      changesets: [{ path: changesetPath, content: changesetContent }],
      changedFiles: [
        { status: 'deleted', path: changesetPath, before: changesetContent },
        {
          status: 'modified',
          mode: '100644',
          path: changelogPath,
          before: CORE_BEFORE,
          after: replaceLine(CORE_BEFORE, '### 💡 Others', [
            '- First paragraph.',
            '',
            `  Second paragraph. ${TRAILER}`,
            '',
            '### 💡 Others',
          ]),
        },
      ],
      prNumber: PR,
      author: AUTHOR,
      packageDirs: new Map([['@expo/config-plugins', 'packages/@expo/config-plugins']]),
    });
    assert.deepEqual(result, { ok: true, errors: [] });
  });

  it('rejects a changeset that still exists', () => {
    assertSingleError(
      withoutFile(validInput(), CHANGESET_PATH),
      /jsi-hide-swift-runtime-exports\.md/,
      /is not deleted/
    );
  });

  it('rejects a changeset that is edited instead of deleted', () => {
    const input = withFile(validInput(), {
      status: 'modified',
      mode: '100644',
      path: CHANGESET_PATH,
      before: CHANGESET_CONTENT,
      after: '',
    });
    assertSingleError(input, /jsi-hide-swift-runtime-exports\.md/, /is not deleted/);
  });

  it('rejects a change to a file that is not a CHANGELOG.md', () => {
    const input = withFile(validInput(), {
      status: 'modified',
      mode: '100644',
      path: 'packages/expo-modules-core/src/index.ts',
      before: 'a\n',
      after: 'b\n',
    });
    assertSingleError(input, /packages\/expo-modules-core\/src\/index\.ts/, /may only change/);
  });

  it('rejects a change to the CHANGELOG.md of a package that no changeset names', () => {
    const before = changelog([]);
    const input = withFile(validInput(), {
      status: 'modified',
      mode: '100644',
      path: 'packages/expo-router/CHANGELOG.md',
      before,
      after: replaceLine(before, '### 💡 Others', [ENTRY, '', '### 💡 Others']),
    });
    assertSingleError(input, /packages\/expo-router\/CHANGELOG\.md/, /may only change/);
  });

  it('rejects a named package whose CHANGELOG.md has no changes', () => {
    assertSingleError(
      withoutFile(validInput(), JSI_CHANGELOG),
      /packages\/expo-modules-jsi\/CHANGELOG\.md/,
      /has no changes/
    );
  });

  it('rejects a named package that does not exist on the target branch', () => {
    const input = withoutFile(validInput(), JSI_CHANGELOG);
    input.packageDirs = new Map([['expo-modules-core', 'packages/expo-modules-core']]);
    assertSingleError(input, /expo-modules-jsi/, /does not exist on this branch/);
  });

  it('names the package.json files it cannot read when a named package does not exist', () => {
    const input = {
      ...withoutFile(validInput(), JSI_CHANGELOG),
      packageDirs: new Map([['expo-modules-core', 'packages/expo-modules-core']]),
      unreadablePackageJsonPaths: ['packages/expo-modules-jsi/package.json'],
    };
    assertSingleError(
      input,
      /"expo-modules-jsi"/,
      /does not exist on this branch/,
      /packages\/expo-modules-jsi\/package\.json/
    );
  });

  it('rejects a removed line', () => {
    const after = replaceLine(CORE_BEFORE, '## 57.0.23 — 2026-10-14', []);
    const input = withCoreAfter(
      validInput(),
      replaceLine(after, '### 💡 Others', [ENTRY, '', '### 💡 Others'])
    );
    assertSingleError(input, /packages\/expo-modules-core\/CHANGELOG\.md/, /removes or edits/);
  });

  it('rejects an edited existing entry', () => {
    const input = withFile(validInput(), {
      status: 'modified',
      mode: '100644',
      path: JSI_CHANGELOG,
      before: JSI_BEFORE,
      after: replaceLine(JSI_BEFORE, EXISTING_JSI_ENTRY, [
        EXISTING_JSI_ENTRY.replace('Fix the', 'Fixed the'),
        ENTRY,
      ]),
    });
    assertSomeError(input, /packages\/expo-modules-jsi\/CHANGELOG\.md/, /removes or edits/);
  });

  it('rejects an entry in a released section', () => {
    const after = replaceLine(CORE_BEFORE, '## 57.0.23 — 2026-10-14', [
      '## 57.0.23 — 2026-10-14',
      '',
      ENTRY,
    ]);
    assertSingleError(
      withCoreAfter(validInput(), after),
      /packages\/expo-modules-core\/CHANGELOG\.md/,
      /outside the "## Unpublished" section/
    );
  });

  it('rejects an entry in "## Unpublished" before its first "###" subsection', () => {
    const after = replaceLine(CORE_BEFORE, '### 🛠 Breaking changes', [
      ENTRY,
      '',
      '### 🛠 Breaking changes',
    ]);
    assertSingleError(
      withCoreAfter(validInput(), after),
      /packages\/expo-modules-core\/CHANGELOG\.md/,
      /not under a "###" subsection/
    );
  });

  it('rejects a CHANGELOG.md without a "## Unpublished" section', () => {
    const before = replaceLine(CORE_BEFORE, '## Unpublished', ['## 57.0.24 — 2026-11-01']);
    const input = withFile(validInput(), {
      status: 'modified',
      mode: '100644',
      path: CORE_CHANGELOG,
      before,
      after: replaceLine(before, '### 💡 Others', [ENTRY, '', '### 💡 Others']),
    });
    assertSingleError(
      input,
      /packages\/expo-modules-core\/CHANGELOG\.md/,
      /has no "## Unpublished" section/
    );
  });

  it('rejects an added line that does not start with "- "', () => {
    const after = replaceLine(CORE_BEFORE, '### 💡 Others', [
      ENTRY,
      `* ${SUMMARY} ${TRAILER}`,
      '',
      '### 💡 Others',
    ]);
    assertSingleError(
      withCoreAfter(validInput(), after),
      /packages\/expo-modules-core\/CHANGELOG\.md/,
      /does not start with "- "/
    );
  });

  for (const heading of [
    '### 🛠 Breaking changes',
    '### 🎉 New features',
    '### 🐛 Bug fixes',
    '### 💡 Others',
  ]) {
    it(`accepts an added "${heading}" subsection in "## Unpublished"`, () => {
      const released = '## 57.0.23 — 2026-10-14';
      const before = ['# Changelog', '', '## Unpublished', '', released, ''].join('\n');
      const input = withFile(validInput(), {
        status: 'modified',
        mode: '100644',
        path: CORE_CHANGELOG,
        before,
        after: replaceLine(before, released, [heading, '', ENTRY, '', released]),
      });
      assert.deepEqual(checkBackportChangelog(input), { ok: true, errors: [] });
    });
  }

  it('accepts an added subsection whose block starts with a blank line', () => {
    const released = '## 57.0.23 — 2026-10-14';
    const before = ['# Changelog', '', '## Unpublished', released, ''].join('\n');
    const input = withFile(validInput(), {
      status: 'modified',
      mode: '100644',
      path: CORE_CHANGELOG,
      before,
      after: replaceLine(before, released, ['', '### 🐛 Bug fixes', '', ENTRY, '', released]),
    });
    assert.deepEqual(checkBackportChangelog(input), { ok: true, errors: [] });
  });

  it('rejects an entry added before a new subsection heading', () => {
    const released = '## 57.0.23 — 2026-10-14';
    const before = ['# Changelog', '', '## Unpublished', released, ''].join('\n');
    const input = withFile(validInput(), {
      status: 'modified',
      mode: '100644',
      path: CORE_CHANGELOG,
      before,
      after: replaceLine(before, released, ['', ENTRY, '', '### 🐛 Bug fixes', '', released]),
    });
    assertSingleError(input, /line 5 is in "## Unpublished" but not under a "###" subsection/);
  });

  for (const heading of ['### Foo', '### 🐛 Bug fixes (iOS)']) {
    it(`rejects an added "${heading}" heading`, () => {
      const after = replaceLine(CORE_BEFORE, '### 💡 Others', [
        heading,
        '',
        ENTRY,
        '',
        '### 💡 Others',
      ]);
      assertSingleError(
        withCoreAfter(validInput(), after),
        /packages\/expo-modules-core\/CHANGELOG\.md/,
        new RegExp(`adds the heading "${heading.replace(/[()]/g, '\\$&')}"`)
      );
    });
  }

  it('rejects an added subsection heading outside "## Unpublished"', () => {
    const released = '## 57.0.23 — 2026-10-14';
    const after = replaceLine(
      replaceLine(CORE_BEFORE, '### 💡 Others', [ENTRY, '', '### 💡 Others']),
      released,
      [released, '', '### 🎉 New features']
    );
    assertSingleError(
      withCoreAfter(validInput(), after),
      /packages\/expo-modules-core\/CHANGELOG\.md/,
      /outside the "## Unpublished" section/
    );
  });

  it('rejects an added subsection heading that "## Unpublished" already has', () => {
    const after = replaceLine(CORE_BEFORE, '### 💡 Others', [
      '### 🐛 Bug fixes',
      '',
      ENTRY,
      '',
      '### 💡 Others',
    ]);
    assertSingleError(
      withCoreAfter(validInput(), after),
      /packages\/expo-modules-core\/CHANGELOG\.md line 11 adds the heading "### 🐛 Bug fixes"/,
      /already has it at line 9/
    );
  });

  it('rejects an added subsection that breaks the order of the "## Unpublished" subsections', () => {
    const released = '## 57.0.23 — 2026-10-14';
    const before = [
      '# Changelog',
      '',
      '## Unpublished',
      '',
      '### 🐛 Bug fixes',
      '',
      released,
      '',
    ].join('\n');
    const input = withFile(validInput(), {
      status: 'modified',
      mode: '100644',
      path: CORE_CHANGELOG,
      before,
      after: replaceLine(before, released, ['### 🎉 New features', '', ENTRY, '', released]),
    });
    assertSingleError(
      input,
      /packages\/expo-modules-core\/CHANGELOG\.md line 7 has the heading "### 🎉 New features" after "### 🐛 Bug fixes"/,
      /"### 🛠 Breaking changes", "### 🎉 New features", "### 🐛 Bug fixes", "### 💡 Others"/
    );
  });

  it('rejects an entry that names another pull request', () => {
    const after = replaceLine(CORE_BEFORE, '### 💡 Others', [
      ENTRY.replaceAll(String(PR), '51464'),
      '',
      '### 💡 Others',
    ]);
    assertSingleError(
      withCoreAfter(validInput(), after),
      /packages\/expo-modules-core\/CHANGELOG\.md/,
      /does not end with/
    );
  });

  it('rejects an entry that names another author', () => {
    const after = replaceLine(CORE_BEFORE, '### 💡 Others', [
      ENTRY.replaceAll(AUTHOR, 'tsapeta'),
      '',
      '### 💡 Others',
    ]);
    assertSingleError(
      withCoreAfter(validInput(), after),
      /packages\/expo-modules-core\/CHANGELOG\.md/,
      /does not end with/
    );
  });

  it('rejects an entry without the trailer', () => {
    const after = replaceLine(CORE_BEFORE, '### 💡 Others', [`- ${SUMMARY}`, '', '### 💡 Others']);
    assertSingleError(
      withCoreAfter(validInput(), after),
      /packages\/expo-modules-core\/CHANGELOG\.md/,
      /does not end with/
    );
  });

  it('rejects a trailer on the closing fence of a code block, but accepts it after the block', () => {
    const entry = (closingLines: string[]) =>
      replaceLine(CORE_BEFORE, '### 💡 Others', [
        '- Call it like this:',
        '',
        '  ```js',
        '  foo();',
        ...closingLines,
        '',
        '### 💡 Others',
      ]);
    assert.deepEqual(
      checkBackportChangelog(withCoreAfter(validInput(), entry(['  ```', '', `  ${TRAILER}`]))),
      { ok: true, errors: [] }
    );
    assertSingleError(
      withCoreAfter(validInput(), entry([`  \`\`\` ${TRAILER}`])),
      /packages\/expo-modules-core\/CHANGELOG\.md/,
      /entry at line \d+ has a code block that does not close/
    );
  });

  it('accepts an entry that starts with a code block on its first line', () => {
    const after = replaceLine(CORE_BEFORE, '### 💡 Others', [
      '- ```js',
      '  foo();',
      '  ```',
      '',
      `  ${TRAILER}`,
      '',
      '### 💡 Others',
    ]);
    assert.deepEqual(checkBackportChangelog(withCoreAfter(validInput(), after)), {
      ok: true,
      errors: [],
    });
  });

  it('rejects an entry that starts with a code block that never closes', () => {
    const after = replaceLine(CORE_BEFORE, '### 💡 Others', [
      '- ```js',
      `  foo(); ${TRAILER}`,
      '',
      '### 💡 Others',
    ]);
    assertSingleError(
      withCoreAfter(validInput(), after),
      /packages\/expo-modules-core\/CHANGELOG\.md/,
      /entry at line \d+ has a code block that does not close/
    );
  });

  it('rejects an entry whose code block never closes', () => {
    const after = replaceLine(CORE_BEFORE, '### 💡 Others', [
      '- Call it like this:',
      '',
      '  ```js',
      `  foo(); ${TRAILER}`,
      '',
      '### 💡 Others',
    ]);
    assertSingleError(
      withCoreAfter(validInput(), after),
      /packages\/expo-modules-core\/CHANGELOG\.md/,
      /entry at line \d+ has a code block that does not close/
    );
  });

  it('rejects an indented line that continues an existing entry', () => {
    const input = withFile(validInput(), {
      status: 'modified',
      mode: '100644',
      path: JSI_CHANGELOG,
      before: JSI_BEFORE,
      after: replaceLine(JSI_BEFORE, EXISTING_JSI_ENTRY, [
        EXISTING_JSI_ENTRY,
        `  ${SUMMARY}`,
        ENTRY,
      ]),
    });
    assertSingleError(input, /packages\/expo-modules-jsi\/CHANGELOG\.md/, /continues an entry/);
  });

  for (const [description, inserted] of [
    ['an entry', [ENTRY]],
    ['an entry and a blank line', [ENTRY, '']],
  ]) {
    it(`rejects ${description} inserted between an existing entry and its continuation line`, () => {
      const existingFirstLine = '- [iOS] Fix the `.swiftinterface` failing to compile';
      const existingContinuation =
        '  with Xcode 27 (Swift 6.4). ([#50569](https://github.com/expo/expo/pull/50569) by [@chrfalch](https://github.com/chrfalch))';
      const before = replaceLine(JSI_BEFORE, EXISTING_JSI_ENTRY, [
        existingFirstLine,
        existingContinuation,
      ]);
      const input = withFile(validInput(), {
        status: 'modified',
        mode: '100644',
        path: JSI_CHANGELOG,
        before,
        after: replaceLine(before, existingFirstLine, [existingFirstLine, ...inserted]),
      });
      assertSingleError(
        input,
        /packages\/expo-modules-jsi\/CHANGELOG\.md/,
        /continues an existing entry/,
        /split/
      );
    });
  }

  for (const heading of ['### Arbitrary', '#### Arbitrary']) {
    it(`rejects an entry under an existing "${heading}" heading in "## Unpublished"`, () => {
      const before = replaceLine(CORE_BEFORE, '### 💡 Others', ['### 💡 Others', '', heading, '']);
      const input = withFile(validInput(), {
        status: 'modified',
        mode: '100644',
        path: CORE_CHANGELOG,
        before,
        after: replaceLine(before, heading, [heading, '', ENTRY]),
      });
      assertSingleError(
        input,
        /packages\/expo-modules-core\/CHANGELOG\.md/,
        new RegExp(`under the heading "${heading}"`)
      );
    });
  }

  it('rejects a CHANGELOG.md change that adds no entry', () => {
    const after = replaceLine(CORE_BEFORE, '### 💡 Others', ['', '### 💡 Others']);
    assertSingleError(
      withCoreAfter(validInput(), after),
      /packages\/expo-modules-core\/CHANGELOG\.md/,
      /adds no entry/
    );
  });

  it('rejects a changeset that cannot be parsed', () => {
    const input = validInput();
    input.changesets = [{ path: CHANGESET_PATH, content: 'no frontmatter\n' }];
    assertSomeError(input, /jsi-hide-swift-runtime-exports\.md/, /cannot be parsed/);
  });

  for (const [mode, kind] of [
    ['100755', 'an executable file'],
    ['120000', 'a symlink'],
    ['160000', 'a submodule'],
  ]) {
    it(`rejects a CHANGELOG.md that becomes ${kind}`, () => {
      const valid = validInput();
      const input = {
        ...valid,
        changedFiles: valid.changedFiles.map((file) =>
          file.path === CORE_CHANGELOG && file.status !== 'deleted' ? { ...file, mode } : file
        ),
      };
      assertSingleError(input, /packages\/expo-modules-core\/CHANGELOG\.md/, new RegExp(mode));
    });
  }

  it('rejects a CHANGELOG.md rewritten with CRLF line endings', () => {
    const after = replaceLine(CORE_BEFORE, '### 💡 Others', [ENTRY, '', '### 💡 Others']);
    assertSomeError(
      withCoreAfter(validInput(), after.replaceAll('\n', '\r\n')),
      /packages\/expo-modules-core\/CHANGELOG\.md/,
      /removes or edits/
    );
  });

  it('rejects an added line that contains a carriage return', () => {
    const after = replaceLine(CORE_BEFORE, '### 💡 Others', [`${ENTRY}\r`, '', '### 💡 Others']);
    assertSingleError(
      withCoreAfter(validInput(), after),
      /packages\/expo-modules-core\/CHANGELOG\.md/,
      /carriage return/
    );
  });

  it('rejects an entry with no text before the trailer', () => {
    const after = replaceLine(CORE_BEFORE, '### 💡 Others', [`- ${TRAILER}`, '', '### 💡 Others']);
    assertSingleError(
      withCoreAfter(validInput(), after),
      /packages\/expo-modules-core\/CHANGELOG\.md/,
      /no text before the trailer/
    );
  });

  it('requires one entry for each changeset that names the package', () => {
    const secondPath = '.changeset/jsi-keep-swift-symbol-names.md';
    const secondContent = "---\n'expo-modules-jsi': patch\n---\n\n[iOS] Keep Swift symbol names.\n";
    const valid = validInput();
    const input = {
      ...valid,
      changesets: [...valid.changesets, { path: secondPath, content: secondContent }],
      changedFiles: [
        ...valid.changedFiles,
        { status: 'deleted' as const, path: secondPath, before: secondContent },
      ],
    };
    assertSingleError(
      input,
      /packages\/expo-modules-jsi\/CHANGELOG\.md/,
      /adds 1 entry, but 2 changesets name/
    );
  });
});

describe('resolveBackportPackages', () => {
  it('rejects a package name with a control character and does not list the package', () => {
    const name = 'foo\0packages/victim/CHANGELOG.md\x7fbar';
    const content = '---\n"foo\\0packages/victim/CHANGELOG.md\\x7fbar": patch\n---\n\nFix foo.\n';
    const result = resolveBackportPackages({
      changesets: [{ path: '.changeset/nul.md', content }],
      packageDirs: new Map([[name, 'packages/foo']]),
    });
    assert.deepEqual(result.packages, []);
    assert.equal(result.errors.length, 1);
    assert.match(result.errors[0], /\.changeset\/nul\.md/);
    assert.match(result.errors[0], /control character/);
    assert.doesNotMatch(result.errors[0], /[\u0000-\u001f\u007f]/);
  });
});

describe('majorReleaseErrors', () => {
  it('names a package with a control character without the control character', () => {
    const content = '---\n"foo\\0bar": major\n---\n\nBreak foo.\n';
    const errors = majorReleaseErrors([{ path: '.changeset/nul.md', content }]);
    assert.equal(errors.length, 1);
    assert.match(errors[0], /\.changeset\/nul\.md makes a major release of "foo\\u0000bar"/);
    assert.doesNotMatch(errors[0], /[\u0000-\u001f\u007f]/);
  });

  it('ignores a changeset that cannot be parsed and one without a major release', () => {
    const errors = majorReleaseErrors([
      { path: '.changeset/broken.md', content: 'No front matter.\n' },
      { path: '.changeset/minor.md', content: "---\n'expo-foo': minor\n---\n\nAdd foo.\n" },
    ]);
    assert.deepEqual(errors, []);
  });
});

describe('convertBackportChangesets', () => {
  const packageDirs = new Map([
    ['expo-modules-core', 'packages/expo-modules-core'],
    ['expo-modules-jsi', 'packages/expo-modules-jsi'],
  ]);
  const OTHERS = '### 💡 Others';
  const NEW_FEATURES = '### 🎉 New features';

  function changeset(
    name: string,
    releases: Record<string, string>,
    summary: string
  ): BackportChangeset {
    const frontMatter = Object.entries(releases).map(([pkg, type]) => `'${pkg}': ${type}`);
    return {
      path: `.changeset/${name}.md`,
      content: ['---', ...frontMatter, '---', '', summary, ''].join('\n'),
    };
  }

  function convert(changesets: BackportChangeset[], changelogs: Record<string, string>) {
    const { packages } = resolveBackportPackages({ changesets, packageDirs });
    return convertBackportChangesets({
      changesets,
      packages,
      changelogs: new Map(Object.entries(changelogs)),
      prNumber: PR,
      author: AUTHOR,
    });
  }

  function assertConverted(
    changesets: BackportChangeset[],
    before: Record<string, string>,
    after: Record<string, string>
  ): void {
    assert.deepEqual(convert(changesets, before), {
      ok: true,
      errors: [],
      changelogs: new Map(Object.entries(after)),
    });
  }

  function assertNotConverted(
    changesets: BackportChangeset[],
    before: Record<string, string>,
    ...patterns: RegExp[]
  ): void {
    const result = convert(changesets, before);
    assert.equal(result.ok, false);
    assert.deepEqual(result.changelogs, new Map());
    assert.ok(
      result.errors.some((error) => patterns.every((pattern) => pattern.test(error))),
      `no error matches ${patterns.join(' and ')}, got:\n${result.errors.join('\n')}`
    );
  }

  it('adds a patch release under "Others", after the heading and its blank line', () => {
    const fix = changeset('fix', { 'expo-modules-core': 'patch' }, SUMMARY);
    assertConverted(
      [fix],
      { [CORE_CHANGELOG]: CORE_BEFORE },
      { [CORE_CHANGELOG]: replaceLine(CORE_BEFORE, OTHERS, [OTHERS, '', ENTRY]) }
    );
  });

  it('adds a minor release under "New features"', () => {
    const feature = changeset('feature', { 'expo-modules-core': 'minor' }, 'Add a feature.');
    assertConverted(
      [feature],
      { [CORE_CHANGELOG]: CORE_BEFORE },
      {
        [CORE_CHANGELOG]: replaceLine(CORE_BEFORE, NEW_FEATURES, [
          NEW_FEATURES,
          '',
          `- Add a feature. ${TRAILER}`,
        ]),
      }
    );
  });

  it('adds a release of type none under "Others"', () => {
    const chore = changeset('chore', { 'expo-modules-core': 'none' }, 'Update a comment.');
    assertConverted(
      [chore],
      { [CORE_CHANGELOG]: CORE_BEFORE },
      {
        [CORE_CHANGELOG]: replaceLine(CORE_BEFORE, OTHERS, [
          OTHERS,
          '',
          `- Update a comment. ${TRAILER}`,
        ]),
      }
    );
  });

  it('indents each line after the first by two spaces and keeps blank lines empty', () => {
    const fix = changeset(
      'fix',
      { 'expo-modules-core': 'patch' },
      'First paragraph.\n\nSecond paragraph,\nwrapped.'
    );
    assertConverted(
      [fix],
      { [CORE_CHANGELOG]: CORE_BEFORE },
      {
        [CORE_CHANGELOG]: replaceLine(CORE_BEFORE, OTHERS, [
          OTHERS,
          '',
          '- First paragraph.',
          '',
          '  Second paragraph,',
          `  wrapped. ${TRAILER}`,
        ]),
      }
    );
  });

  it('puts the trailer on its own line after a summary that ends with a code block', () => {
    const fix = changeset(
      'fix',
      { 'expo-modules-core': 'patch' },
      'Call it like this:\n\n```js\nfoo();\n```'
    );
    assertConverted(
      [fix],
      { [CORE_CHANGELOG]: CORE_BEFORE },
      {
        [CORE_CHANGELOG]: replaceLine(CORE_BEFORE, OTHERS, [
          OTHERS,
          '',
          '- Call it like this:',
          '',
          '  ```js',
          '  foo();',
          '  ```',
          '',
          `  ${TRAILER}`,
        ]),
      }
    );
  });

  it('puts the trailer on its own line after a summary that is only a code block', () => {
    const fix = changeset('fix', { 'expo-modules-core': 'patch' }, '```js\nfoo();\n```');
    assertConverted(
      [fix],
      { [CORE_CHANGELOG]: CORE_BEFORE },
      {
        [CORE_CHANGELOG]: replaceLine(CORE_BEFORE, OTHERS, [
          OTHERS,
          '',
          '- ```js',
          '  foo();',
          '  ```',
          '',
          `  ${TRAILER}`,
        ]),
      }
    );
  });

  it('appends the trailer to the last line of a summary that starts with a code block', () => {
    const fix = changeset(
      'fix',
      { 'expo-modules-core': 'patch' },
      '```js\nfoo();\n```\n\nCall it once.'
    );
    assertConverted(
      [fix],
      { [CORE_CHANGELOG]: CORE_BEFORE },
      {
        [CORE_CHANGELOG]: replaceLine(CORE_BEFORE, OTHERS, [
          OTHERS,
          '',
          '- ```js',
          '  foo();',
          '  ```',
          '',
          `  Call it once. ${TRAILER}`,
        ]),
      }
    );
  });

  it('adds the entry after the last existing entry of the section', () => {
    const before = replaceLine(CORE_BEFORE, OTHERS, [OTHERS, '', EXISTING_JSI_ENTRY]);
    const fix = changeset('fix', { 'expo-modules-core': 'patch' }, SUMMARY);
    assertConverted(
      [fix],
      { [CORE_CHANGELOG]: before },
      { [CORE_CHANGELOG]: replaceLine(before, EXISTING_JSI_ENTRY, [EXISTING_JSI_ENTRY, ENTRY]) }
    );
  });

  it('adds a missing section heading in the order of the subsections', () => {
    const existing = '- Fix an existing bug.';
    const before = [
      '# Changelog',
      '',
      '## Unpublished',
      '',
      '### 🐛 Bug fixes',
      '',
      existing,
      '',
      '## 1.0.0',
      '',
    ].join('\n');
    const feature = changeset('feature', { 'expo-modules-core': 'minor' }, 'Add a feature.');
    const fix = changeset('fix', { 'expo-modules-core': 'patch' }, SUMMARY);
    assertConverted(
      [feature, fix],
      { [CORE_CHANGELOG]: before },
      {
        [CORE_CHANGELOG]: [
          '# Changelog',
          '',
          '## Unpublished',
          '',
          NEW_FEATURES,
          '',
          `- Add a feature. ${TRAILER}`,
          '',
          '### 🐛 Bug fixes',
          '',
          existing,
          '',
          OTHERS,
          '',
          ENTRY,
          '',
          '## 1.0.0',
          '',
        ].join('\n'),
      }
    );
  });

  it('adds one entry to each package that a changeset names', () => {
    const fix = { path: CHANGESET_PATH, content: CHANGESET_CONTENT };
    assertConverted(
      [fix],
      { [CORE_CHANGELOG]: CORE_BEFORE, [JSI_CHANGELOG]: JSI_BEFORE },
      {
        [JSI_CHANGELOG]: replaceLine(JSI_BEFORE, OTHERS, [OTHERS, '', ENTRY]),
        [CORE_CHANGELOG]: replaceLine(CORE_BEFORE, OTHERS, [OTHERS, '', ENTRY]),
      }
    );
  });

  it('adds the entries of two changesets that name the same package in changeset order', () => {
    const first = changeset('a', { 'expo-modules-core': 'patch' }, 'Fix one.');
    const second = changeset('b', { 'expo-modules-core': 'patch' }, 'Fix two.');
    assertConverted(
      [first, second],
      { [CORE_CHANGELOG]: CORE_BEFORE },
      {
        [CORE_CHANGELOG]: replaceLine(CORE_BEFORE, OTHERS, [
          OTHERS,
          '',
          `- Fix one. ${TRAILER}`,
          `- Fix two. ${TRAILER}`,
        ]),
      }
    );
  });

  it('writes no changelog when one of them has no "## Unpublished" section', () => {
    const fix = { path: CHANGESET_PATH, content: CHANGESET_CONTENT };
    const released = CORE_BEFORE.replace('## Unpublished', '## 57.0.24');
    assertNotConverted(
      [fix],
      { [CORE_CHANGELOG]: released, [JSI_CHANGELOG]: JSI_BEFORE },
      /packages\/expo-modules-core\/CHANGELOG\.md has no "## Unpublished" section/
    );
  });

  it('writes no changelog for a changeset with an empty summary', () => {
    const empty = changeset('empty', { 'expo-modules-core': 'patch' }, '');
    assertNotConverted(
      [empty],
      { [CORE_CHANGELOG]: CORE_BEFORE },
      /\.changeset\/empty\.md has no summary/
    );
  });

  it('writes no changelog for a major release', () => {
    const fix = changeset('fix', { 'expo-modules-core': 'patch' }, 'Fix one.');
    const breaking = changeset('breaking', { 'expo-modules-jsi': 'major' }, 'Break it.');
    assertNotConverted(
      [fix, breaking],
      { [CORE_CHANGELOG]: CORE_BEFORE, [JSI_CHANGELOG]: JSI_BEFORE },
      /\.changeset\/breaking\.md makes a major release of "expo-modules-jsi"/
    );
  });

  it('writes no changelog for a summary whose code block does not close', () => {
    const open = changeset('open', { 'expo-modules-core': 'patch' }, 'Call it:\n\n```js\nfoo();');
    assertNotConverted(
      [open],
      { [CORE_CHANGELOG]: CORE_BEFORE },
      /\.changeset\/open\.md/,
      /code block that does not close/
    );
  });

  it('writes LF line endings for a changeset with CRLF line endings', () => {
    const fix = {
      path: '.changeset/crlf.md',
      content: "---\r\n'expo-modules-core': patch\r\n---\r\n\r\nFirst.\r\nSecond.\r\n",
    };
    assertConverted(
      [fix],
      { [CORE_CHANGELOG]: CORE_BEFORE },
      {
        [CORE_CHANGELOG]: replaceLine(CORE_BEFORE, OTHERS, [
          OTHERS,
          '',
          '- First.',
          `  Second. ${TRAILER}`,
        ]),
      }
    );
  });

  it('writes changelogs that checkBackportChangelog accepts', () => {
    const before = [
      '# Changelog',
      '',
      '## Unpublished',
      '',
      '### 🐛 Bug fixes',
      '',
      EXISTING_JSI_ENTRY,
      '',
      '## 1.0.0',
      '',
    ].join('\n');
    const changesets = [
      { path: CHANGESET_PATH, content: CHANGESET_CONTENT },
      changeset('feature', { 'expo-modules-core': 'minor' }, 'Add it:\n\n```js\nfoo();\n```'),
      changeset('chore', { 'expo-modules-jsi': 'none' }, 'First.\n\nSecond.'),
    ];
    const changelogs: Record<string, string> = {
      [CORE_CHANGELOG]: before,
      [JSI_CHANGELOG]: JSI_BEFORE,
    };
    const result = convert(changesets, changelogs);
    assert.deepEqual(result.errors, []);

    const changedFiles: BackportChangedFile[] = [
      ...changesets.map(
        ({ path, content }): BackportChangedFile => ({ status: 'deleted', path, before: content })
      ),
      ...[...result.changelogs].map(
        ([path, after]): BackportChangedFile => ({
          status: 'modified',
          mode: '100644',
          path,
          before: changelogs[path],
          after,
        })
      ),
    ];
    assert.deepEqual(
      checkBackportChangelog({
        changesets,
        changedFiles,
        prNumber: PR,
        author: AUTHOR,
        packageDirs,
      }),
      { ok: true, errors: [] }
    );
  });

  for (const [kind, summary] of [
    ['a multi-paragraph entry', 'One.\n\nTwo.\n\nThree.'],
    ['an entry that ends in a code block', 'Call it:\n\n```js\nfoo();\n```'],
    ['an entry whose second paragraph is indented', 'One.\n\n  - Two.'],
  ]) {
    it(`accepts ${kind} added below an existing entry of the same subsection`, () => {
      const before = replaceLine(CORE_BEFORE, OTHERS, [OTHERS, '', '- An existing entry.']);
      const changesets = [changeset('multi', { 'expo-modules-core': 'patch' }, summary)];
      const result = convert(changesets, { [CORE_CHANGELOG]: before });
      assert.deepEqual(result.errors, []);
      assert.deepEqual(
        checkBackportChangelog({
          changesets,
          changedFiles: [
            { status: 'deleted', path: changesets[0].path, before: changesets[0].content },
            {
              status: 'modified',
              mode: '100644',
              path: CORE_CHANGELOG,
              before,
              after: result.changelogs.get(CORE_CHANGELOG)!,
            },
          ],
          prNumber: PR,
          author: AUTHOR,
          packageDirs,
        }),
        { ok: true, errors: [] }
      );
    });
  }

  it('rejects an indented line after a blank line that follows a complete new entry', () => {
    const changesets = [changeset('fix', { 'expo-modules-core': 'patch' }, 'New.')];
    const lines = (...entries: string[]) =>
      ['# Changelog', '', '## Unpublished', '', OTHERS, '', ...entries, '', '## 1.0.0', ''].join(
        '\n'
      );
    const before = lines('- Old entry.');
    const result = checkBackportChangelog({
      changesets,
      changedFiles: [
        { status: 'deleted', path: changesets[0].path, before: changesets[0].content },
        {
          status: 'modified',
          mode: '100644',
          path: CORE_CHANGELOG,
          before,
          after: lines('- Old entry.', `- New. ${TRAILER}`, '', '  Sneaky.'),
        },
      ],
      prNumber: PR,
      author: AUTHOR,
      packageDirs,
    });
    assert.equal(result.ok, false);
    assert.match(result.errors.join('\n'), /does not end with/);
  });
});
