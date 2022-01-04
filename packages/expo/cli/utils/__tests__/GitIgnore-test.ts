import fs from 'fs-extra';
import path from 'path';
import temporary from 'tempy';

import * as GitIgnore from '../GitIgnore';

const testRoot = temporary.directory();
beforeAll(async () => {
  await fs.ensureDir(testRoot);
});
afterAll(async () => {
  await fs.remove(testRoot);
});

const gitignore1 = `
# hello world
*/foo

ios/

/android 
## bar

`;

// A gitignore with an old generated section
const gitignore2 = `a
b
${GitIgnore.createGeneratedHeaderComment('...')}
foo
bar
${GitIgnore.generatedFooterComment}
c
d`;

// A broken generated section
const gitignore3 = `a
b
${GitIgnore.createGeneratedHeaderComment('...')}
foo
bar
c
d`;

// Footer is before header
const gitignore4 = `a
b
${GitIgnore.generatedFooterComment}
foo
bar
${GitIgnore.createGeneratedHeaderComment('...')}
c
d`;

it(`sanitizes comments, new lines, and sort order`, () => {
  expect(GitIgnore.getSanitizedGitIgnoreLines(gitignore1)).toStrictEqual([
    '*/foo',
    '/android ',
    'ios/',
  ]);
});

describe('removeGeneratedGitIgnoreContents', () => {
  it(`removes a generated gitignore`, () => {
    expect(GitIgnore.removeGeneratedGitIgnoreContents(gitignore2)?.split('\n')).toStrictEqual([
      'a',
      'b',
      'c',
      'd',
    ]);
  });
  it(`removes nothing from a regular gitignore`, () => {
    expect(GitIgnore.removeGeneratedGitIgnoreContents(gitignore1)).toBe(null);
  });
  it(`removes nothing when the generated footer is missing`, () => {
    expect(GitIgnore.removeGeneratedGitIgnoreContents(gitignore3)).toBe(null);
  });
  it(`removes nothing when the footer precede the header`, () => {
    expect(GitIgnore.removeGeneratedGitIgnoreContents(gitignore4)).toBe(null);
  });
});

describe('mergeGitIgnore', () => {
  it(`skips merging if the target file is missing`, async () => {
    // fs
    const projectRoot = path.join(testRoot, 'merge-git-ignore-skip-when-target-missing');
    await fs.ensureDir(projectRoot);
    // Setup

    const targetGitIgnorePath = path.join(projectRoot, '.gitignore');
    // Skip writing a gitignore

    const sourceGitIgnorePath = path.join(projectRoot, '.gitignore-other');
    await fs.writeFile(
      sourceGitIgnorePath,
      [
        'alpha',
        'beta',
        // in the future we may want to merge this value with the existing matching value
        // or maybe we could keep the code simple and not do that :]
        'bar',
      ].join('\n')
    );

    expect(GitIgnore.mergeGitIgnorePaths(targetGitIgnorePath, sourceGitIgnorePath)).toBe(null);
    expect(fs.existsSync(targetGitIgnorePath)).toBe(false);
  });
  it(`merges two git ignore files in the filesystem`, async () => {
    // fs
    const projectRoot = path.join(testRoot, 'merge-git-ignore-works');
    await fs.ensureDir(projectRoot);
    // Setup
    const targetGitIgnorePath = path.join(projectRoot, '.gitignore');
    await fs.writeFile(
      targetGitIgnorePath,
      [
        'foo',
        // Test a duplicate value
        'bar',
      ].join('\n')
    );

    const sourceGitIgnorePath = path.join(projectRoot, '.gitignore-other');
    await fs.writeFile(
      sourceGitIgnorePath,
      [
        'alpha',
        'beta',
        // in the future we may want to merge this value with the existing matching value
        // or maybe we could keep the code simple and not do that :]
        'bar',
      ].join('\n')
    );

    const results = GitIgnore.mergeGitIgnorePaths(targetGitIgnorePath, sourceGitIgnorePath);
    expect(results).not.toBe(null);
    expect(results.contents).toMatch(
      /generated expo-cli sync-69a5afdba5ff28bbd11618f94ae2dc4bfdfd7cae/
    );
    expect(results.contents).toMatch(/foo/);
    expect(results.contents).toMatch(/alpha/);
    expect(results.didMerge).toBe(true);

    expect(fs.readFileSync(targetGitIgnorePath, 'utf8')).toBe(results.contents);
  });
});
