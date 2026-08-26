import { resolveWorkTreeAsync, runGitAsync } from '../../utils/git';
import { listChangedFilesAsync, parseStatusZ } from '../changedFiles';

jest.mock('../../utils/git', () => ({
  resolveWorkTreeAsync: jest.fn(),
  runGitAsync: jest.fn(),
}));

describe(parseStatusZ, () => {
  it(`should read nothing out of an empty status`, () => {
    expect(parseStatusZ('')).toEqual([]);
  });

  it(`should read one modified file`, () => {
    expect(parseStatusZ(' M src/app/index.tsx\0')).toEqual(['src/app/index.tsx']);
  });

  it(`should read an untracked file`, () => {
    expect(parseStatusZ('?? src/app/notes.tsx\0')).toEqual(['src/app/notes.tsx']);
  });

  it(`should read several records`, () => {
    expect(parseStatusZ(' M a.ts\0?? b.ts\0 D c.ts\0')).toEqual(['a.ts', 'b.ts', 'c.ts']);
  });

  it(`should count a rename once, at its new path`, () => {
    // git writes the source path as a bare record right after the rename, with no status prefix.
    // Counting both would report a move as two changed files.
    expect(parseStatusZ('R  new.ts\0old.ts\0 M other.ts\0')).toEqual(['new.ts', 'other.ts']);
  });

  it(`should count a copy once, the same way`, () => {
    expect(parseStatusZ('C  copy.ts\0source.ts\0')).toEqual(['copy.ts']);
  });

  it(`should keep a path with a space in it whole`, () => {
    // The reason the parse is NUL-separated: git quotes and escapes such a path in the newline
    // form, and a reader that split on newlines would report the wrong thing.
    expect(parseStatusZ(' M src/my component.tsx\0')).toEqual(['src/my component.tsx']);
  });

  it(`should keep a path with a newline in it whole`, () => {
    expect(parseStatusZ(' M src/odd\nname.tsx\0')).toEqual(['src/odd\nname.tsx']);
  });

  it(`should skip a record with a status and no path`, () => {
    expect(parseStatusZ(' M \0 M a.ts\0')).toEqual(['a.ts']);
  });
});

// @ref ../changedFiles — friction run 6, F60. `impact` printed "This project is not in a git work
// tree" for a project another command had just read git from in the same directory. Both resolve
// the work tree the same way; the difference was that a failed `git status` borrowed the sentence
// written for a project with no repository at all.
describe(`${listChangedFilesAsync.name} and the two ways it has no answer`, () => {
  it(`says the project has no work tree when git says so`, async () => {
    jest.mocked(resolveWorkTreeAsync).mockResolvedValue(null);

    const result = await listChangedFilesAsync('/project');

    expect(result.gap).toBe('not-a-work-tree');
    expect(result.files).toBeNull();
  });

  it(`does not claim there is no work tree when there is one and git failed`, async () => {
    jest.mocked(resolveWorkTreeAsync).mockResolvedValue({ toplevel: '/repo', prefix: 'app' });
    jest.mocked(runGitAsync).mockRejectedValue(new Error('fatal: bad object HEAD'));

    const result = await listChangedFilesAsync('/repo/app');

    expect(result.gap).toBe('git-failed');
    expect(result.detail).toContain('/repo');
    expect(result.detail).toContain('bad object HEAD');
  });
});
