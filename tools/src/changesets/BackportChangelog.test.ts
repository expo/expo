import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, describe, it } from 'node:test';

import { convertChangesetsAsync } from './BackportChangelog';

const TRAILER =
  '([#51463](https://github.com/expo/expo/pull/51463) by [@chrfalch](https://github.com/chrfalch))';
const NEW_FEATURES = '### 🎉 New features';
const OTHERS = '### 💡 Others';
const CHANGELOG = [
  '# Changelog',
  '',
  '## Unpublished',
  '',
  '### 🛠 Breaking changes',
  '',
  NEW_FEATURES,
  '',
  '### 🐛 Bug fixes',
  '',
  OTHERS,
  '',
  '## 57.0.23 — 2026-10-14',
  '',
  '### 🐛 Bug fixes',
  '',
  '- Fix an old bug. ([#50000](https://github.com/expo/expo/pull/50000) by [@tsapeta](https://github.com/tsapeta))',
  '',
].join('\n');

const roots: string[] = [];
after(() => roots.forEach((root) => fs.rmSync(root, { recursive: true, force: true })));

/** Converts one changeset for `expo-modules-core` and returns the new CHANGELOG.md. */
async function convert(type: string, summary: string, changelog = CHANGELOG, template = false) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-backport-changelog-'));
  roots.push(root);
  const templateRelease = template ? `'expo-template-default': ${type}\n` : '';
  const files = {
    'packages/expo-modules-core/package.json': '{ "name": "expo-modules-core" }\n',
    'packages/expo-modules-core/CHANGELOG.md': changelog,
    ...(template && {
      'templates/expo-template-default/package.json': '{ "name": "expo-template-default" }\n',
    }),
    '.changeset/fix.md': `---\n'expo-modules-core': ${type}\n${templateRelease}---\n\n${summary}\n`,
  };
  for (const [file, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), content);
  }
  await convertChangesetsAsync(root, ['.changeset/fix.md'], { number: 51463, author: 'chrfalch' });
  assert.equal(fs.existsSync(path.join(root, '.changeset/fix.md')), false);
  return fs.readFileSync(path.join(root, 'packages/expo-modules-core/CHANGELOG.md'), 'utf8');
}

/** Replaces the first line equal to `line` with `replacement`. */
function replaceLine(text: string, line: string, replacement: string[]): string {
  const lines = text.split('\n');
  lines.splice(lines.indexOf(line), 1, ...replacement);
  return lines.join('\n');
}

describe('convertChangesetsAsync', () => {
  for (const [type, section] of [
    ['major', '### 🛠 Breaking changes'],
    ['minor', NEW_FEATURES],
    ['patch', OTHERS],
    ['none', OTHERS],
  ]) {
    it(`adds a ${type} change under "${section}" with the trailer`, async () => {
      assert.equal(
        await convert(type, 'Fix a crash.'),
        replaceLine(CHANGELOG, section, [section, '', `- Fix a crash. ${TRAILER}`])
      );
    });
  }

  it('adds the entry after the last existing entry of the section', async () => {
    const before = replaceLine(CHANGELOG, OTHERS, [OTHERS, '', '- First entry.', '- Last entry.']);
    assert.equal(
      await convert('patch', 'Fix a crash.', before),
      replaceLine(before, '- Last entry.', ['- Last entry.', `- Fix a crash. ${TRAILER}`])
    );
  });

  for (const [kind, summary, entry] of [
    [
      'a multi-paragraph entry',
      'One.\n\nTwo.\n\nThree.',
      ['- One.', '', '  Two.', '', `  Three. ${TRAILER}`],
    ],
    [
      'an entry that ends in a code block',
      'Call it:\n\n```js\nfoo();\n```',
      ['- Call it:', '', '  ```js', '  foo();', '  ```', '', `  ${TRAILER}`],
    ],
    [
      'an entry whose second paragraph is indented',
      'One.\n\n  - Two.',
      ['- One.', '', `    - Two. ${TRAILER}`],
    ],
  ] as const) {
    it(`adds ${kind} below an existing entry of the same section`, async () => {
      const before = replaceLine(CHANGELOG, OTHERS, [OTHERS, '', '- An existing entry.']);
      assert.equal(
        await convert('patch', summary, before),
        replaceLine(before, '- An existing entry.', ['- An existing entry.', ...entry])
      );
    });
  }

  it('puts the trailer on its own line after a summary that is only a code block', async () => {
    assert.equal(
      await convert('patch', '```js\nfoo();\n```'),
      replaceLine(CHANGELOG, OTHERS, [
        OTHERS,
        '',
        '- ```js',
        '  foo();',
        '  ```',
        '',
        `  ${TRAILER}`,
      ])
    );
  });

  it('skips a named package without a CHANGELOG.md, such as a template', async () => {
    assert.equal(
      await convert('patch', 'Fix a crash.', CHANGELOG, true),
      replaceLine(CHANGELOG, OTHERS, [OTHERS, '', `- Fix a crash. ${TRAILER}`])
    );
  });

  it('fails without a "## Unpublished" section', async () => {
    const released = CHANGELOG.replace('## Unpublished', '## 57.0.24');
    await assert.rejects(
      convert('patch', 'Fix a crash.', released),
      /packages\/expo-modules-core\/CHANGELOG\.md has no "## Unpublished" section/
    );
  });
});
