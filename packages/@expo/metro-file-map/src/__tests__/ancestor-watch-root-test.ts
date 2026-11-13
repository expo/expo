import { vol } from 'memfs';

import createFallbackFilesystem from '../crawlers/node/fallback';
import { RootPathUtils } from '../lib/RootPathUtils';
import TreeFS from '../lib/TreeFS';

jest.mock('path', () => jest.requireActual<typeof import('path')>('path').posix);

test.each(['/monorepo/packages', '/monorepo'])(
  'resolves an external symlink target when %s is watched',
  (ancestorRoot) => {
    const rootDir = '/monorepo/packages/app';
    const rootPathUtils = new RootPathUtils(rootDir);
    vol.reset();
    vol.fromJSON({ '/store/pkg/entry.js': 'module.exports = 42;' });
    vol.mkdirSync(`${rootDir}/node_modules`, { recursive: true });
    vol.symlinkSync('/store/pkg', `${rootDir}/node_modules/pkg`);
    const tree = new TreeFS({
      rootDir,
      serverRoot: '/monorepo',
      roots: [rootDir, ancestorRoot],
      files: new Map([
        ['node_modules/pkg', [0, 0, 0, null, rootPathUtils.absoluteToNormal('/store/pkg'), null]],
      ]),
      processFile: async () => {
        throw new Error('Not implemented');
      },
      fallbackFilesystem: createFallbackFilesystem({
        rootPathUtils,
        extensions: ['js'],
        ignore: () => false,
        includeSymlinks: true,
      }),
    });

    expect(tree.lookup(`${rootDir}/node_modules/pkg/entry.js`)).toMatchObject({
      exists: true,
      realPath: '/store/pkg/entry.js',
      type: 'f',
    });
  }
);
