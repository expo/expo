import { describeEmptyScan, describeWarnings } from '../generateTypesCommand';

const FILE = '/pkg/ios/Demo.swift';

describe(describeWarnings, () => {
  it('returns nothing without warnings', () => {
    expect(describeWarnings([])).toBeNull();
  });

  it('counts the warnings and how many rendered a type as unknown', () => {
    expect(
      describeWarnings([
        { file: FILE, location: 'M.a', message: "unresolved type 'X' rendered as unknown" },
        {
          file: FILE,
          location: 'M.b',
          message: "unmodeled Swift type '(Int, Int)' rendered as unknown",
        },
        {
          file: FILE,
          location: 'M.c',
          message: "another member already uses the JS name 'c', so this one was skipped",
        },
      ])
    ).toBe('3 warnings, 2 rendered as unknown, 1 skipped:');
  });

  it('uses singular forms', () => {
    expect(
      describeWarnings([
        { file: FILE, location: 'M.a', message: "unresolved type 'X' rendered as unknown" },
      ])
    ).toBe('1 warning, 1 rendered as unknown:');
  });

  it('leaves out categories that do not apply', () => {
    expect(
      describeWarnings([
        {
          file: FILE,
          location: 'M',
          message:
            "another declaration already uses the TypeScript name 'MEvents', so the events map was inlined",
        },
      ])
    ).toBe('1 warning:');
  });
});

describe(describeEmptyScan, () => {
  const packageDir = '/pkg';

  it('explains that no Swift file was found', () => {
    expect(describeEmptyScan({ filesScanned: 0, filesParsed: 0, durationMs: 1 }, packageDir)).toBe(
      'No Swift files found in /pkg. The scan skips dependency, build, test, and example ' +
        'directories, so the Swift sources of the package must live outside those.'
    );
  });

  it('explains that no scanned file declares an exported type', () => {
    expect(describeEmptyScan({ filesScanned: 3, filesParsed: 0, durationMs: 1 }, packageDir)).toBe(
      'Scanned 3 Swift files in /pkg, but none declares a native type exported to JavaScript.'
    );
  });

  it('uses the singular form for one file', () => {
    expect(
      describeEmptyScan({ filesScanned: 1, filesParsed: 0, durationMs: 1 }, packageDir)
    ).toMatch(/^Scanned 1 Swift file in/);
  });
});
