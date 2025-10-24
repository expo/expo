import { Glob } from 'glob'; // Use 'Glob' class for more control or the promisified version
import { vol } from 'memfs';
import { promisify } from 'util';

import { globMatchFunctorAllAsync, globMatchFunctorFirstAsync } from '../fileUtils';

// Promisify glob for easier async handling
const glob = promisify(Glob);

describe('globMatchFunctorAllAsync and globMatchFunctorFirstAsync', () => {
  beforeEach(() => {
    vol.reset();
    vol.fromJSON({
      '/app/1.txt': '1',
      '/app/1.json': '{}',
      '/app/1.js': 'console.log("1");',
      '/app/2.js': 'console.log("2");',
      '/app/3.js': 'console.error("3");',
      '/app/4.ts': 'console.log("4");',
      '/app/5.tsx': 'console.log("5");',
    });
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
    expect(matched.sort((a, b) => a.localeCompare(b))).toEqual(['1', '2', '4']);
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
    expect(matched).toEqual('4');
  });

  it('should use the ignore patterns from options', async () => {
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
      { cwd: '/app', ignore: ['2.js'] }
    );
    expect(matched.sort((a, b) => a.localeCompare(b))).toEqual(['1', '4']);
  });
});
