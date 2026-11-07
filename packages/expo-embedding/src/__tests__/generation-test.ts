import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { withGenerationRollback } from '../generation';
describe('Regenerating native integration', () => {
  let root: string;
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'expo-generation-test-'));
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));
  it('should retain a successful generation', async () => {
    const path = join(root, 'project.pbxproj');
    await withGenerationRollback([path], () => writeFileSync(path, 'new'));
    expect(readFileSync(path, 'utf8')).toBe('new');
  });
  it('should restore existing files and remove newly generated files on failure', async () => {
    const existing = join(root, 'project.pbxproj');
    const created = join(root, 'provider.swift');
    const userFile = join(root, 'user.swift');
    writeFileSync(existing, 'previous');
    writeFileSync(userFile, 'user code');
    await expect(
      withGenerationRollback([existing, created], async () => {
        await writeFile(existing, 'partial');
        await writeFile(created, 'partial');
        throw new Error('generation failed');
      })
    ).rejects.toThrow('generation failed');
    expect(readFileSync(existing, 'utf8')).toBe('previous');
    expect(existsSync(created)).toBe(false);
    expect(readFileSync(userFile, 'utf8')).toBe('user code');
  });
});
