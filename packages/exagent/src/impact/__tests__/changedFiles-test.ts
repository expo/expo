import { parseStatusZ } from '../changedFiles';

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
