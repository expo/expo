import { getDefaultCustomizeFrame } from '../customizeFrame';

describe(getDefaultCustomizeFrame, () => {
  it('collapses URL frames and removes their locations', () => {
    const customizeFrame = getDefaultCustomizeFrame();

    expect(
      customizeFrame({
        file: 'http://localhost:8081/index.bundle?platform=ios',
        lineNumber: 10,
        column: 20,
        methodName: 'render',
      })
    ).toEqual({
      file: 'http://localhost:8081/index.bundle?platform=ios',
      lineNumber: null,
      column: null,
      methodName: 'render',
      collapse: true,
    });
  });

  it('does not collapse valid source file frames', () => {
    const customizeFrame = getDefaultCustomizeFrame();

    expect(
      customizeFrame({
        file: '/Users/app/src/index.tsx',
        lineNumber: 10,
        column: 20,
        methodName: 'render',
      })
    ).toEqual({
      file: '/Users/app/src/index.tsx',
      lineNumber: 10,
      column: 20,
      methodName: 'render',
      collapse: false,
    });
  });

  it('collapses node_modules frames with POSIX separators', () => {
    const customizeFrame = getDefaultCustomizeFrame();

    expect(
      customizeFrame({
        file: '/Users/app/node_modules/react/index.js',
        lineNumber: 10,
        column: 20,
        methodName: 'render',
      })
    ).toEqual({
      file: '/Users/app/node_modules/react/index.js',
      lineNumber: 10,
      column: 20,
      methodName: 'render',
      collapse: true,
    });
  });

  it('collapses node_modules frames with Windows separators', () => {
    jest.isolateModules(() => {
      mockWindowsPath();

      const { getDefaultCustomizeFrame } =
        require('../customizeFrame') as typeof import('../customizeFrame');
      const customizeFrame = getDefaultCustomizeFrame();

      expect(
        customizeFrame({
          file: 'C:\\Users\\app\\node_modules\\react\\index.js',
          lineNumber: 10,
          column: 20,
          methodName: 'render',
        })
      ).toEqual({
        file: 'C:\\Users\\app\\node_modules\\react\\index.js',
        lineNumber: 10,
        column: 20,
        methodName: 'render',
        collapse: true,
      });
    });
  });

  it.each([
    'C:\\Users\\app\\src\\index.tsx',
    'D:/Users/app/src/index.tsx',
    'K:\\Users\\app\\src\\index.tsx',
  ])('does not treat Windows absolute path %s as a URL', (file) => {
    jest.isolateModules(() => {
      mockWindowsPath();

      const { getDefaultCustomizeFrame } =
        require('../customizeFrame') as typeof import('../customizeFrame');
      const customizeFrame = getDefaultCustomizeFrame();

      expect(
        customizeFrame({
          file,
          lineNumber: 10,
          column: 20,
          methodName: 'render',
        })
      ).toEqual({
        file,
        lineNumber: 10,
        column: 20,
        methodName: 'render',
        collapse: false,
      });
    });
  });
});

function mockWindowsPath() {
  const path = jest.requireActual<typeof import('node:path')>('node:path');
  const windowsPath = {
    __esModule: true,
    ...path.win32,
    default: path.win32,
  };

  jest.doMock('node:path', () => windowsPath);
  jest.doMock('path', () => windowsPath);
}
