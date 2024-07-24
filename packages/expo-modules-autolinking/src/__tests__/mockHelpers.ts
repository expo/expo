import minimatch from 'minimatch';
import path from 'path';

export function registerGlobMock(globFunction: Function, files: string[], cwd: string) {
  (globFunction as jest.MockedFunction<any>).mockImplementation((patterns, inputOptions) => {
    const inputCwd: string = inputOptions?.cwd ?? process.cwd();

    // Simple implementation of cwd matching.
    // E.g. inputCwd='/path/to/expo' and cwd='/path/to',
    // -> `prefix`: 'expo/'
    // -> glob pattern would like something like `expo/*/*`
    const prefix = path.relative(inputCwd, cwd);

    const patternList = Array.isArray(patterns) ? patterns : [patterns];
    return files
      .map((file) => {
        for (const pattern of patternList) {
          if (minimatch(file, `${prefix}${pattern}`)) {
            return file.substring(prefix.length);
          }
        }
        return undefined;
      })
      .filter(Boolean);
  });
}

/**
 * Mock the `glob` function to return multiple results for multiple patterns.
 * This mock assumes that the `glob(..., { cwd: <cwd> })` is set to the keys of `files`.
 */
export function registerMultiGlobMock(globFunction: Function, files: Record<string, string[]>) {
  (globFunction as jest.MockedFunction<any>).mockImplementation((patterns, inputOptions) => {
    const inputCwd: string = inputOptions?.cwd ?? process.cwd();
    const patternList = Array.isArray(patterns) ? patterns : [patterns];

    return files[inputCwd]
      .map((file) => {
        for (const pattern of patternList) {
          if (minimatch(file, pattern)) {
            return file;
          }
        }
        return undefined;
      })
      .filter(Boolean);
  });
}

export function registerRequireMock(filePath: string, content: object) {
  jest.doMock(filePath, () => content, { virtual: true });
}
