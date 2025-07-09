import { glob } from 'glob';
import { vol } from 'memfs';

import { globMatchFunctorAllAsync, globMatchFunctorFirstAsync } from '../fileUtils';

jest.mock('fs/promises');
jest.mock('glob');

describe('globMatchFunctorAllAsync and globMatchFunctorFirstAsync', () => {
  const mockGlobStream = glob.stream as jest.MockedFunction<typeof glob.stream>;

  beforeEach(() => {
    vol.fromJSON({
      '/app/1.txt': '1',
      '/app/1.json': '{}',
      '/app/1.js': 'console.log("1");',
      '/app/2.js': 'console.log("2");',
      '/app/3.js': 'console.error("3");',
      '/app/4.ts': 'console.log("4");',
      '/app/5.tsx': 'console.log("5");',
    });

    // NOTE: Cast because the utility uses the result as an async iterable
    mockGlobStream.mockReturnValue(['1.js', '2.js', '3.js', '4.ts'] as any);
  });

  afterAll(() => {
    vol.reset();
  });

  it('should return all matches from the globMatchFunctorAllAsync', async () => {
    const matched = await globMatchFunctorAllAsync(
      '*.{js,ts}',
      (filePath, contents) => {
        expect(filePath).toMatch(/\.(js|ts)/);
        const pattern = /console\.log\("(.+)"\);/;
        const match = contents.toString().match(pattern);
        if (match) {
          return match[1];
        }
        return null;
      },
      { cwd: '/app' }
    );
    expect(matched).toEqual(['1', '2', '4']);
  });

  it('should return the first match from the globMatchFunctorFirstAsync', async () => {
    const matched = await globMatchFunctorFirstAsync(
      '*.{js,ts}',
      (filePath, contents) => {
        expect(filePath).toMatch(/\.(js|ts)/);
        const pattern = /console\.log\("(.+)"\);/;
        const match = contents.toString().match(pattern);
        if (match) {
          return match[1];
        }
        return null;
      },
      { cwd: '/app' }
    );
    expect(matched).toEqual('1');
  });
});
