import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { compareStructureChange } from './structure.ts';
import { DOCS_ROOT, findStalePages, hashContent, readManifest } from './sync.ts';

interface Synced {
  key: string;
  notes: string;
}

interface Skipped {
  key: string;
  reason: string;
}

const model = process.env.JA_TRANSLATOR_MODEL ?? 'claude-opus-5-5';
const manifest = readManifest();

function git(...args: string[]): string {
  return execFileSync('git', args, { cwd: DOCS_ROOT, encoding: 'utf8', maxBuffer: 64 << 20 });
}

function changedFiles(): Map<string, string> {
  const repoRoot = git('rev-parse', '--show-toplevel').trim();
  const files = new Map<string, string>();
  for (const line of git('status', '--porcelain', '--untracked-files=all').split('\n')) {
    if (line) {
      const file = line.slice(3);
      const absolutePath = path.join(repoRoot, file);
      files.set(
        file,
        fs.existsSync(absolutePath) ? hashContent(fs.readFileSync(absolutePath)) : 'deleted'
      );
    }
  }
  return files;
}

function englishAtLastSync(key: string): { commit: string; source: string } | undefined {
  const hash = manifest[key];
  if (!hash) {
    return undefined;
  }
  const commit = git(
    'log',
    '-1',
    '--format=%H',
    `-S"${key}": "${hash}"`,
    '--',
    'checks/ja/source-hashes.json'
  ).trim();
  if (!commit) {
    return undefined;
  }
  const show = spawnSync('git', ['show', `${commit}:./pages/${key}`], {
    cwd: DOCS_ROOT,
    encoding: 'utf8',
    maxBuffer: 64 << 20,
  });
  if (show.status !== 0 || hashContent(show.stdout) !== hash) {
    return undefined;
  }
  return { commit, source: show.stdout };
}

function buildPrompt(key: string, englishDiff: string): string {
  return [
    `Update the Japanese page pages/ja/${key} so that it matches its English source, pages/${key}, again.`,
    'Apply only the English change in the diff below. Keep every Japanese sentence that the change does not touch.',
    'Copy code, import lines, JSX tag names, prop names, URLs, and frontmatter keys exactly. Translate prose, headings, link text, text props that readers see, @tutinfo tooltip text, and the frontmatter values of title, sidebar_title, description, and summary.',
    `Match the style, register, and terms of the existing Japanese page. Edit only pages/ja/${key}.`,
    'If the change needs no Japanese edit, do not edit the page, and start your reply with NO_CHANGE.',
    'Otherwise, reply with one line for each term or sentence that a native Japanese reviewer should check, or reply none.',
    '',
    '```diff',
    englishDiff,
    '```',
  ].join('\n');
}

function syncPage(key: string): Synced | Skipped {
  const lastSync = englishAtLastSync(key);
  if (!lastSync) {
    return { key, reason: 'the English version from the last sync is not in the git history' };
  }

  const japanesePath = path.join(DOCS_ROOT, 'pages', 'ja', key);
  const englishAfter = fs.readFileSync(path.join(DOCS_ROOT, 'pages', key), 'utf8');
  const japaneseBefore = fs.readFileSync(japanesePath, 'utf8');

  const claude = spawnSync(
    'claude',
    [
      '-p',
      buildPrompt(key, git('diff', lastSync.commit, '--', `pages/${key}`)),
      '--model',
      model,
      '--strict-mcp-config',
      '--disallowedTools',
      'Bash',
      '--allowedTools',
      `Read,Edit(pages/ja/${key})`,
      '--output-format',
      'text',
    ],
    { cwd: DOCS_ROOT, encoding: 'utf8', maxBuffer: 16 << 20 }
  );
  if (claude.error) {
    console.error(
      `Could not start the claude CLI (${claude.error.message}). translate.ts uses Claude Code to update each Japanese page. Install it with npm install -g @anthropic-ai/claude-code, then run the script again.`
    );
    process.exit(1);
  }
  const reply = claude.stdout.trim();
  const noChangeNeeded = reply.startsWith('NO_CHANGE');
  const japaneseAfter = fs.readFileSync(japanesePath, 'utf8');

  const problems =
    claude.status !== 0
      ? [`claude exited with status ${claude.status}: ${claude.stderr.trim()}`]
      : japaneseAfter === japaneseBefore && !noChangeNeeded
        ? ['the Japanese page did not change']
        : compareStructureChange({
            englishBefore: lastSync.source,
            englishAfter,
            japaneseBefore,
            japaneseAfter,
          });

  if (problems.length > 0) {
    fs.writeFileSync(japanesePath, japaneseBefore);
    return { key, reason: problems.join('; ') };
  }
  return { key, notes: noChangeNeeded ? 'No Japanese change was needed.' : reply };
}

function writeSummary(synced: Synced[], skipped: Skipped[]): string {
  const lines = [
    '# Why',
    '',
    'English tutorial pages changed after their Japanese translations were last synced. `.github/workflows/docs-ja-sync.yml` opened this PR.',
    '',
    '# How',
    '',
  ];
  if (synced.length > 0) {
    lines.push('Updated these Japanese pages and stamped their hashes:', '');
    for (const { key, notes } of synced) {
      lines.push(`- \`pages/ja/${key}\``);
      for (const note of notes.split('\n').filter(Boolean)) {
        lines.push(`  - ${note.replace(/^\s*[*-]\s+/, '')}`);
      }
    }
    lines.push('');
  }
  if (skipped.length > 0) {
    lines.push('Left these pages for a person to sync:', '');
    for (const { key, reason } of skipped) {
      lines.push(`- \`pages/ja/${key}\`: ${reason}`);
    }
    lines.push('');
  }
  lines.push('# Test Plan', '', '`pnpm ja:check` lists none of the updated pages as stale.');
  return `${lines.join('\n')}\n`;
}

const synced: Synced[] = [];
const skipped: Skipped[] = [];
const changedBefore = changedFiles();

for (const key of findStalePages().stale) {
  const result = syncPage(key);
  if ('reason' in result) {
    skipped.push(result);
    console.log(
      `${process.env.GITHUB_ACTIONS === 'true' ? '::warning::' : ''}Skipped pages/ja/${key}: ${result.reason}`
    );
  } else {
    synced.push(result);
    console.log(`Synced pages/ja/${key}`);
  }
}

if (synced.length > 0) {
  execFileSync(
    process.execPath,
    ['--experimental-strip-types', 'checks/ja/stamp.ts', ...synced.map(({ key }) => key)],
    { cwd: DOCS_ROOT, stdio: 'inherit' }
  );
}

const allowed = new Set([
  'docs/checks/ja/source-hashes.json',
  ...synced.map(({ key }) => `docs/pages/ja/${key}`),
]);
const unexpected = [...changedFiles()]
  .filter(([file, hash]) => !allowed.has(file) && changedBefore.get(file) !== hash)
  .map(([file]) => file);
if (unexpected.length > 0) {
  console.error(
    `The translation run changed files outside the synced Japanese pages: ${unexpected.join(', ')}. Nothing was committed. Check the run log for the agent that wrote them.`
  );
  process.exit(1);
}

const summary = writeSummary(synced, skipped);
console.log(summary);
if (process.env.JA_SYNC_SUMMARY) {
  fs.writeFileSync(process.env.JA_SYNC_SUMMARY, summary);
}
if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(
    process.env.GITHUB_OUTPUT,
    `changed=${synced.length > 0}\nskipped=${skipped.length}\n`
  );
}
