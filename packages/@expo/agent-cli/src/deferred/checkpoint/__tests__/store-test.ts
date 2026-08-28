// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0008
//
import fs from 'fs';
import { vol } from 'memfs';

import {
  CHECKPOINTS_FILE_NAME,
  MAX_CHECKPOINTS,
  findCheckpoint,
  formatAge,
  readCheckpoints,
  recordCheckpoint,
  resolveCommandArgv,
} from '../store';
import type { CheckpointRecord } from '../types';

const projectRoot = '/project';
const storeFile = `${projectRoot}/.expo/${CHECKPOINTS_FILE_NAME}`;

function record(overrides: Partial<CheckpointRecord> = {}): CheckpointRecord {
  return {
    id: '1111111111111111111111111111111111111111',
    label: '@expo/agent-cli install',
    createdAt: '2026-08-22T10:00:00.000Z',
    argv: ['@expo/agent-cli', 'install', 'expo-sqlite'],
    path: '',
    ...overrides,
  };
}

beforeEach(() => {
  vol.reset();
  vol.fromJSON({ '/project/package.json': '{}' });
});

describe(readCheckpoints, () => {
  it(`should return nothing when the project has no store`, () => {
    expect(readCheckpoints(projectRoot)).toEqual([]);
  });

  it(`should read the stored checkpoints`, () => {
    vol.fromJSON({ [storeFile]: JSON.stringify({ checkpoints: [record()] }) });

    expect(readCheckpoints(projectRoot)).toEqual([record()]);
  });

  it(`should ignore a corrupt store instead of failing the command`, () => {
    vol.fromJSON({ [storeFile]: '{ not json' });

    expect(readCheckpoints(projectRoot)).toEqual([]);
  });

  it(`should ignore entries that are not checkpoint records`, () => {
    vol.fromJSON({
      [storeFile]: JSON.stringify({
        checkpoints: [record(), { id: 42 }, null, { label: 'no id' }],
      }),
    });

    expect(readCheckpoints(projectRoot)).toEqual([record()]);
  });

  it(`should default the optional fields of a partial record`, () => {
    vol.fromJSON({
      [storeFile]: JSON.stringify({ checkpoints: [{ id: 'abc', createdAt: 'now' }] }),
    });

    expect(readCheckpoints(projectRoot)).toEqual([
      { id: 'abc', label: '', createdAt: 'now', argv: [], path: '' },
    ]);
  });
});

describe(recordCheckpoint, () => {
  it(`should create the store in the .expo directory`, () => {
    recordCheckpoint(projectRoot, record());

    expect(fs.existsSync(storeFile)).toBe(true);
    expect(readCheckpoints(projectRoot)).toEqual([record()]);
  });

  it(`should keep the newest checkpoint first`, () => {
    recordCheckpoint(projectRoot, record({ id: 'aaa' }));
    recordCheckpoint(projectRoot, record({ id: 'bbb' }));

    expect(readCheckpoints(projectRoot).map((entry) => entry.id)).toEqual(['bbb', 'aaa']);
  });

  it(`should prune the oldest checkpoints beyond the cap`, () => {
    for (let index = 0; index < MAX_CHECKPOINTS + 5; index++) {
      recordCheckpoint(projectRoot, record({ id: `id-${index}` }));
    }

    const stored = readCheckpoints(projectRoot);
    expect(stored).toHaveLength(MAX_CHECKPOINTS);
    expect(stored[0]!.id).toBe(`id-${MAX_CHECKPOINTS + 4}`);
    expect(stored.at(-1)!.id).toBe(`id-5`);
  });

  it(`should replace a corrupt store`, () => {
    vol.fromJSON({ [storeFile]: '{ not json' });

    recordCheckpoint(projectRoot, record());

    expect(readCheckpoints(projectRoot)).toEqual([record()]);
  });

  it(`should never fail the command when the store cannot be written`, () => {
    const writeFileSync = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {
      throw new Error('EACCES: permission denied');
    });

    expect(() => recordCheckpoint(projectRoot, record())).not.toThrow();

    writeFileSync.mockRestore();
  });
});

describe(findCheckpoint, () => {
  const records = [record({ id: 'bbbb222' }), record({ id: 'aaaa111' })];

  it(`should return the newest checkpoint when no id is given`, () => {
    expect(findCheckpoint(records)?.id).toBe('bbbb222');
  });

  it(`should return null when there is no checkpoint at all`, () => {
    expect(findCheckpoint([])).toBeNull();
  });

  it(`should match an id exactly`, () => {
    expect(findCheckpoint(records, 'aaaa111')?.id).toBe('aaaa111');
  });

  it(`should match an abbreviated id`, () => {
    expect(findCheckpoint(records, 'aaa')?.id).toBe('aaaa111');
  });

  it(`should return null for an unknown id`, () => {
    expect(findCheckpoint(records, 'cccc')).toBeNull();
  });
});

describe(resolveCommandArgv, () => {
  it(`should describe the command that is running`, () => {
    expect(
      resolveCommandArgv(['/usr/bin/node', '/tmp/bin/cli.js', 'install', 'expo-sqlite'])
    ).toEqual(['@expo/agent-cli', 'install', 'expo-sqlite']);
  });

  it(`should describe a bare invocation`, () => {
    expect(resolveCommandArgv(['/usr/bin/node', '/tmp/bin/cli.js'])).toEqual(['@expo/agent-cli']);
  });
});

describe(formatAge, () => {
  const now = new Date('2026-08-22T12:00:00.000Z');

  it(`should report the age in the largest whole unit`, () => {
    expect(formatAge('2026-08-22T11:59:50.000Z', now)).toBe('10s');
    expect(formatAge('2026-08-22T11:30:00.000Z', now)).toBe('30m');
    expect(formatAge('2026-08-22T09:00:00.000Z', now)).toBe('3h');
    expect(formatAge('2026-08-20T12:00:00.000Z', now)).toBe('2d');
  });

  it(`should report an unparsable timestamp as unknown`, () => {
    expect(formatAge('not a date', now)).toBe('?');
  });
});
