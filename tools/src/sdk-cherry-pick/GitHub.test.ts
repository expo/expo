import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';

import { GhCli } from './GitHub';
import { FatalError, Output } from './Process';

let root: string;
let originalPath: string | undefined;

before(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-sdk-cherry-pick-gh-'));
  fs.writeFileSync(path.join(root, 'gh'), '#!/bin/sh\necho "<html>Bad gateway</html>"\n', {
    mode: 0o755,
  });
  originalPath = process.env.PATH;
  process.env.PATH = `${root}${path.delimiter}${originalPath}`;
});

after(() => {
  process.env.PATH = originalPath;
  fs.rmSync(root, { recursive: true, force: true });
});

function recordUntrusted(): { output: Output; untrusted: string[] } {
  const untrusted: string[] = [];
  const output: Output = {
    log: async () => {},
    error: async () => {},
    untrusted: async (text) => {
      untrusted.push(text);
    },
  };
  return { output, untrusted };
}

describe('GhCli', () => {
  it('prints what gh pr view printed when it is not JSON, and returns empty fields as jq did', async () => {
    const { output, untrusted } = recordUntrusted();
    const github = new GhCli('expo/expo', output);

    assert.deepEqual(await github.viewPullRequestAsync('5'), {
      state: '',
      baseRefName: '',
      mergeSha: '',
      title: '',
      author: '',
    });
    assert.deepEqual(untrusted, ['<html>Bad gateway</html>\n']);
  });

  it('prints what gh printed when it is not a JSON array, and says what to do next', async () => {
    const { output, untrusted } = recordUntrusted();
    const github = new GhCli('expo/expo', output);

    await assert.rejects(github.listBotBackportsAsync('bot/sdk-90-cherry-pick-1', 'sdk-90'), {
      constructor: FatalError,
      message:
        '`gh pr list --head` did not print a JSON array, so the bot cannot tell which pull requests exist. The run log shows what it printed. Re-run the failed jobs of the workflow run.',
    });
    assert.deepEqual(untrusted, ['<html>Bad gateway</html>\n']);
  });
});
