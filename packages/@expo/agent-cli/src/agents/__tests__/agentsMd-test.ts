import { vol } from 'memfs';

import {
  AGENTS_MD_FILE,
  applyManagedBlock,
  BLOCK_END,
  BLOCK_START,
  checkClaudeMdReferenceAsync,
  writeManagedBlockAsync,
} from '../agentsMd';

const projectRoot = '/project';

beforeEach(() => {
  vol.reset();
  vol.mkdirSync(projectRoot, { recursive: true });
});

describe(applyManagedBlock, () => {
  it('should create a file holding only the wrapped block', () => {
    expect(applyManagedBlock(null, 'Body line.')).toBe(
      [BLOCK_START, 'Body line.', BLOCK_END, ''].join('\n')
    );
  });

  it('should treat an empty file like a missing one', () => {
    expect(applyManagedBlock('', 'Body line.')).toBe(
      [BLOCK_START, 'Body line.', BLOCK_END, ''].join('\n')
    );
  });

  it('should append the block after existing content, separated by a blank line', () => {
    const result = applyManagedBlock('# My rules\n\nAlways run the tests.\n', 'Body line.');

    expect(result).toBe(
      [
        '# My rules',
        '',
        'Always run the tests.',
        '',
        BLOCK_START,
        'Body line.',
        BLOCK_END,
        '',
      ].join('\n')
    );
  });

  it('should replace only the block and keep user content byte for byte', () => {
    const before = [
      '# My rules',
      '',
      'Keep this exact    spacing.',
      '',
      BLOCK_START,
      'Old body.',
      'More old body.',
      BLOCK_END,
      '',
      '## After',
      '',
      'And this too.',
      '',
    ].join('\n');

    const result = applyManagedBlock(before, 'New body.');

    expect(result).toBe(
      [
        '# My rules',
        '',
        'Keep this exact    spacing.',
        '',
        BLOCK_START,
        'New body.',
        BLOCK_END,
        '',
        '## After',
        '',
        'And this too.',
        '',
      ].join('\n')
    );
  });

  it('should be idempotent', () => {
    const once = applyManagedBlock('# My rules\n', 'Body line.\nSecond line.');
    const twice = applyManagedBlock(once, 'Body line.\nSecond line.');

    expect(twice).toBe(once);
  });

  it('should ignore trailing newlines of the generated body', () => {
    expect(applyManagedBlock(null, 'Body line.\n\n')).toBe(applyManagedBlock(null, 'Body line.'));
  });

  it('should report an unclosed managed block instead of overwriting the rest of the file', () => {
    const before = ['# My rules', BLOCK_START, 'Old body.', '', 'User content.', ''].join('\n');

    expect(() => applyManagedBlock(before, 'New body.')).toThrow(
      /END EXPO AGENT CLI MANAGED BLOCK/
    );
    // Nothing after the start marker is lost, because nothing is written at all.
    expect(before).toContain('User content.');
  });
});

describe(writeManagedBlockAsync, () => {
  it('should create AGENTS.md when the project has none', async () => {
    await expect(writeManagedBlockAsync(projectRoot, 'Body line.')).resolves.toEqual({
      path: AGENTS_MD_FILE,
      action: 'created',
    });

    expect(vol.readFileSync(`${projectRoot}/AGENTS.md`, 'utf8')).toBe(
      [BLOCK_START, 'Body line.', BLOCK_END, ''].join('\n')
    );
  });

  it('should update the block of an existing file', async () => {
    vol.writeFileSync(
      `${projectRoot}/AGENTS.md`,
      [BLOCK_START, 'Old body.', BLOCK_END, ''].join('\n')
    );

    await expect(writeManagedBlockAsync(projectRoot, 'New body.')).resolves.toEqual({
      path: AGENTS_MD_FILE,
      action: 'updated',
    });

    expect(vol.readFileSync(`${projectRoot}/AGENTS.md`, 'utf8')).toContain('New body.');
  });

  it('should report a file that already matches as skipped, and not rewrite it', async () => {
    await writeManagedBlockAsync(projectRoot, 'Body line.');
    const before = vol.readFileSync(`${projectRoot}/AGENTS.md`, 'utf8');

    await expect(writeManagedBlockAsync(projectRoot, 'Body line.')).resolves.toEqual({
      path: AGENTS_MD_FILE,
      action: 'skipped',
    });

    expect(vol.readFileSync(`${projectRoot}/AGENTS.md`, 'utf8')).toBe(before);
  });
});

describe(checkClaudeMdReferenceAsync, () => {
  it('should return null when the project has no CLAUDE.md', async () => {
    await expect(checkClaudeMdReferenceAsync(projectRoot)).resolves.toBeNull();
  });

  it('should return null when CLAUDE.md points at AGENTS.md', async () => {
    vol.writeFileSync(`${projectRoot}/CLAUDE.md`, '# Rules\n\nSee AGENTS.md for the project.\n');

    await expect(checkClaudeMdReferenceAsync(projectRoot)).resolves.toBeNull();
  });

  it('should return null when CLAUDE.md is a symlink to AGENTS.md', async () => {
    vol.writeFileSync(`${projectRoot}/AGENTS.md`, '# Rules\n');
    vol.symlinkSync(`${projectRoot}/AGENTS.md`, `${projectRoot}/CLAUDE.md`);

    await expect(checkClaudeMdReferenceAsync(projectRoot)).resolves.toBeNull();
  });

  it('should note a CLAUDE.md that never mentions AGENTS.md', async () => {
    vol.writeFileSync(`${projectRoot}/CLAUDE.md`, '# Rules\n\nRun the tests.\n');

    await expect(checkClaudeMdReferenceAsync(projectRoot)).resolves.toEqual(
      expect.stringContaining('CLAUDE.md')
    );
  });
});

describe('Writing AGENTS.md that is not a regular file', () => {
  it('should refuse to write through a symlink that leaves the project', async () => {
    vol.mkdirSync('/outside', { recursive: true });
    vol.writeFileSync('/outside/authorized_keys', 'ssh-ed25519 AAAA real@key\n');
    vol.symlinkSync('/outside/authorized_keys', `${projectRoot}/AGENTS.md`);

    await expect(writeManagedBlockAsync(projectRoot, 'Body line.')).rejects.toThrow(/symlink/i);

    expect(vol.readFileSync('/outside/authorized_keys', 'utf8')).toBe(
      'ssh-ed25519 AAAA real@key\n'
    );
  });

  it('should refuse to write through a symlink that stays inside the project', async () => {
    vol.writeFileSync(`${projectRoot}/notes.md`, 'mine\n');
    vol.symlinkSync(`${projectRoot}/notes.md`, `${projectRoot}/AGENTS.md`);

    await expect(writeManagedBlockAsync(projectRoot, 'Body line.')).rejects.toThrow(/symlink/i);

    expect(vol.readFileSync(`${projectRoot}/notes.md`, 'utf8')).toBe('mine\n');
  });

  it('should still write a regular AGENTS.md', async () => {
    vol.writeFileSync(`${projectRoot}/AGENTS.md`, '# Mine\n');

    await expect(writeManagedBlockAsync(projectRoot, 'Body line.')).resolves.toEqual({
      path: AGENTS_MD_FILE,
      action: 'updated',
    });
  });
});
