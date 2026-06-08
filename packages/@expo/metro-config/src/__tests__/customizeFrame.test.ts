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

  it.each([
    'C:\\Users\\app\\src\\index.tsx',
    'D:/Users/app/src/index.tsx',
    'K:\\Users\\app\\src\\index.tsx',
  ])(
    'does not treat Windows absolute path %s as a URL',
    file => {
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
    }
  );
});
