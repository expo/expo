import minimatch from 'minimatch';

export function registerGlobMock(globFunction: Function, files: string[], cwd: string) {
  (globFunction as jest.MockedFunction<any>).mockImplementation((patterns, inputOptions) => {
    const inputCwd: string = inputOptions?.cwd ?? process.cwd();

    // Easy implementation of cwd matching.
    // E.g. inputCwd='/path/to/expo' and cwd='/path/to',
    // -> `prefix`: 'expo/'
    // -> glob pattern would like something like `expo/*/*`
    let prefix = '';
    if (inputCwd.startsWith(`${cwd}/`)) {
      prefix = `${inputCwd.substring(cwd.length + 1)}/`;
    }

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

export function registerRequireMock(filePath: string, content: object) {
  jest.doMock(filePath, () => content, { virtual: true });
}
