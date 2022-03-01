import minimatch from 'minimatch';

export function registerGlobMock(globFunction: Function, files: string[]) {
  (globFunction as jest.MockedFunction<any>).mockImplementation((patterns) => {
    const patternList = Array.isArray(patterns) ? patterns : [patterns];
    return files.filter((file) => patternList.some((pattern) => minimatch(file, pattern)));
  });
}

export function registerRequireMock(filePath: string, content: object) {
  jest.doMock(filePath, () => content, { virtual: true });
}
