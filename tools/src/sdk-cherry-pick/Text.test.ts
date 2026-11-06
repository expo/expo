import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { loadConfig } from './Config';
import {
  backportTitle,
  buildNote,
  commentText,
  conflictList,
  errorList,
  manualSteps,
  rebuildFailedComment,
} from './Text';

const config = loadConfig({
  PR_NUMBER: '3',
  SDK_VERSION: '90',
  REPO_DIR: '/repo',
  TMPDIR: '/tmp',
});

describe('commentText', () => {
  it('removes backticks and @, and turns CR and LF into spaces', () => {
    assert.equal(commentText('`@evil`\r\nname'), 'evil  name');
  });

  it('keeps the first 200 characters, counting code points', () => {
    assert.equal(commentText('x'.repeat(300)), 'x'.repeat(200));
    assert.equal(commentText('💡'.repeat(201)), '💡'.repeat(200));
  });
});

describe('errorList', () => {
  it('puts each error in a code span without backticks or line breaks, and keeps @', () => {
    assert.equal(
      errorList(['Entry `x` by @someone\r\nis wrong', 'z'.repeat(400)]),
      `- \`Entry x by @someone  is wrong\`\n- \`${'z'.repeat(300)}\``
    );
  });

  it('lists the first 10 errors and counts the rest', () => {
    const errors = Array.from({ length: 12 }, (_, index) => `error ${index + 1}`);
    const lines = errorList(errors).split('\n');
    assert.equal(lines.length, 11);
    assert.equal(lines[9], '- `error 10`');
    assert.equal(lines[10], '- 2 more. The run log lists every error.');
  });

  it('adds no count line for exactly 10 errors', () => {
    const errors = Array.from({ length: 10 }, (_, index) => `error ${index + 1}`);
    assert.equal(errorList(errors).split('\n').length, 10);
  });
});

describe('backportTitle', () => {
  it('names the target branch and the original pull request', () => {
    assert.equal(backportTitle('sdk-90', 'Title of #3', '3'), '[sdk-90] Title of #3 (#3)');
  });

  it('removes the parentheses of each (#N) in the title', () => {
    assert.equal(
      backportTitle('sdk-90', 'Revert "Fix X (#52000)"', '3'),
      '[sdk-90] Revert "Fix X #52000" (#3)'
    );
    assert.equal(
      backportTitle('sdk-90', 'A (#1) and B (#22)', '3'),
      '[sdk-90] A #1 and B #22 (#3)'
    );
    assert.equal(backportTitle('sdk-90', '(#1)(#2)', '3'), '[sdk-90] #1#2 (#3)');
  });

  it('repeats until no (#N) is left, so ((#N)) loses both pairs', () => {
    assert.equal(
      backportTitle('sdk-90', 'Revert "Fix X ((#52000))"', '3'),
      '[sdk-90] Revert "Fix X #52000" (#3)'
    );
    assert.equal(backportTitle('sdk-90', '((#1)(#2))', '3'), '[sdk-90] (#1#2) (#3)');
  });

  it('keeps (#) and (#x1), which name no pull request', () => {
    assert.equal(
      backportTitle('sdk-90', 'Keep (#) and (#x1)', '3'),
      '[sdk-90] Keep (#) and (#x1) (#3)'
    );
  });
});

describe('manualSteps', () => {
  const steps = [
    'To backport it by hand:',
    '',
    '```sh',
    'git fetch origin main sdk-90',
    'git checkout -b bot/sdk-90-cherry-pick-3 origin/sdk-90',
    'git cherry-pick -x 0123456789abcdef0123456789abcdef01234567',
    '```',
  ].join('\n');
  const sha = '0123456789abcdef0123456789abcdef01234567';

  it('has only the commands for a branch with changesets', () => {
    assert.equal(manualSteps(config, sha, 'yes'), steps);
  });

  it('says how to convert the changesets for a branch without changesets', () => {
    assert.equal(
      manualSteps(config, sha, 'no'),
      `${steps}\n\n\`sdk-90\` does not use changesets. For each \`.changeset/*.md\` file that this pull request adds, add its summary as an entry under \`## Unpublished\` in the \`CHANGELOG.md\` of each package that it names. Then delete the changeset file.`
    );
  });

  it('says how to tell whether the branch uses changesets when that is unknown', () => {
    assert.equal(
      manualSteps(config, sha, 'unknown'),
      `${steps}\n\nIf \`sdk-90\` has no \`.changeset/config.json\`, it does not use changesets. Then, for each \`.changeset/*.md\` file that this pull request adds, add its summary as an entry under \`## Unpublished\` in the \`CHANGELOG.md\` of each package that it names, and delete the changeset file.`
    );
  });

  it('names a placeholder when the merge commit is not known', () => {
    assert.match(manualSteps(config, '', 'yes'), /^git cherry-pick -x <merge commit of #3>$/m);
  });
});

describe('conflictList', () => {
  it('lists the conflicting files without backticks', () => {
    assert.equal(conflictList('a`tick.txt\nb.txt\n'), 'atick.txt\nb.txt');
  });

  it('is empty when no file conflicts', () => {
    assert.equal(conflictList(''), '');
  });

  it('lists the first 50 files and counts the rest', () => {
    const files = Array.from({ length: 60 }, (_, index) => `f${index + 1}.txt`);
    const lines = conflictList(files.join('\n') + '\n').split('\n');
    assert.equal(lines.length, 51);
    assert.equal(lines[49], 'f50.txt');
    assert.equal(lines[50], '10 more. The run log lists every file.');
  });

  it('lists exactly 50 files without a count', () => {
    const files = Array.from({ length: 50 }, (_, index) => `f${index + 1}.txt`);
    assert.equal(conflictList(files.join('\n')).split('\n').length, 50);
  });
});

describe('buildNote', () => {
  it('is empty when no source next to a tracked build/ changes', () => {
    assert.equal(buildNote('sdk-96', []), '');
  });

  it('lists each directory once, sorted, and names the command', () => {
    assert.equal(
      buildNote('sdk-96', ['packages/expo-foo/plugin', 'packages/expo-foo', 'packages/expo-foo']),
      [
        '',
        '`sdk-96` tracks `build/` directories in git. This backport changes the source next to these directories:',
        '',
        '- `packages/expo-foo/build`',
        '- `packages/expo-foo/plugin/build`',
        '',
        'The bot rebuilds them and pushes any change in a commit named `Rebuild build/ for the backport`. If that commit does not appear and check-packages fails, run `et check-packages --since origin/sdk-96` in a checkout of this branch, then commit and push the changed `build/` files.',
      ].join('\n')
    );
  });

  it('removes backticks and @ from the directories', () => {
    assert.match(buildNote('sdk-96', ['packages/`@x`']), /^- `packages\/x\/build`$/m);
  });
});

describe('rebuildFailedComment', () => {
  const runLog = loadConfig({
    PR_NUMBER: '3',
    SDK_VERSION: '90',
    REPO_DIR: '/repo',
    GITHUB_RUN_ID: '7',
  });
  const manualStep =
    '\n\nTo rebuild them by hand, run `et check-packages --since origin/sdk-90` in a checkout of this branch. Then commit and push the changed `build/` files.';

  it('says what failed, links the run log, and names the manual step', () => {
    assert.equal(
      rebuildFailedComment(runLog, 'rebuild'),
      `The bot could not rebuild the \`build/\` directories of this backport. [Run log](https://github.com/expo/expo/actions/runs/7)${manualStep}`
    );
  });

  it('has a fixed sentence for each failure', () => {
    assert.deepEqual(
      (['apply', 'rejected', 'moved', 'push'] as const).map((failure) =>
        rebuildFailedComment(config, failure)
      ),
      [
        `The bot could not apply the rebuilt \`build/\` directories to this branch.${manualStep}`,
        `The bot did not push the rebuilt \`build/\` directories, because the rebuild changed files that the bot does not push.${manualStep}`,
        `The bot did not push the rebuilt \`build/\` directories, because this branch changed after the bot opened this pull request.${manualStep}`,
        `The bot could not push the rebuilt \`build/\` directories to this branch.${manualStep}`,
      ]
    );
  });
});
