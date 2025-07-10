/* eslint-env jest */
import JsonFile from '@expo/json-file';
import fs from 'fs/promises';
import { sync as globSync } from 'glob';
import crypto from 'node:crypto';
import path from 'path';

import { projectRoot, setupTestProjectWithOptionsAsync, findProjectFiles } from './utils';
import { toPosixPath } from '../../src/utils/filePath';
import { executeExpoAsync } from '../utils/expo';

const originalForceColor = process.env.FORCE_COLOR;
const originalCI = process.env.CI;

beforeAll(async () => {
  await fs.mkdir(projectRoot, { recursive: true });
  process.env.FORCE_COLOR = '0';
  process.env.CI = '1';
  process.env._EXPO_E2E_USE_PATH_ALIASES = '1';
});

afterAll(() => {
  process.env.FORCE_COLOR = originalForceColor;
  process.env.CI = originalCI;
  delete process.env._EXPO_E2E_USE_PATH_ALIASES;
});

interface ReplacedFile {
  oldFile: string;
  newFile: string;
}

describe('Export DOM Components', () => {
  let projectRoot: string;

  beforeAll(async () => {
    projectRoot = await setupTestProjectWithOptionsAsync('dom-export', 'with-dom');

    // TODO(kudo,20250304): Remove this once we publish `@expo/metro-config` with DOM components fixes.
    const srcMetroConfig = path.resolve(__dirname, '../../../metro-config/build');
    const destMetroConfig = path.join(projectRoot, 'node_modules/@expo/metro-config/build');
    await fs.cp(srcMetroConfig, destMetroConfig, { recursive: true, force: true });
  });

  it('runs `npx expo export`', async () => {
    // `npx expo export`
    await executeExpoAsync(
      projectRoot,
      ['export', '--source-maps', '--dump-assetmap', '--platform', 'ios'],
      {
        env: {
          NODE_ENV: 'production',
          TEST_BABEL_PRESET_EXPO_MODULE_ID: require.resolve('babel-preset-expo'),
          EXPO_USE_FAST_RESOLVER: 'true',
        },
      }
    );

    const outputDir = path.join(projectRoot, 'dist');

    // Native bundle should link to MD5 named DOM component HTML entry
    const nativeBundlePath = globSync('**/*.{hbc,js}', {
      cwd: path.join(outputDir, '_expo/static/js/ios'),
      absolute: true,
    })[0];
    const domEntry = await fs.readFile(
      globSync('www.bundle/**/*.html', {
        cwd: outputDir,
        absolute: true,
      })[0],
      'utf8'
    );
    const md5HtmlBundle = crypto.createHash('md5').update(domEntry).digest('hex');
    const nativeBundle = await fs.readFile(nativeBundlePath);
    expect(nativeBundle.indexOf(Buffer.from(`${md5HtmlBundle}.html`))).toBeGreaterThan(-1);

    // <script src> should link to MD5 named JS bundle
    const domJsBundleContent = await fs.readFile(
      globSync('www.bundle/**/*.js', {
        cwd: outputDir,
        absolute: true,
      })[0],
      'utf8'
    );
    const md5DomJsBundle = crypto.createHash('md5').update(domJsBundleContent).digest('hex');
    expect(
      domEntry.indexOf(`<script src="./${md5DomJsBundle}.js" defer></script>`)
    ).toBeGreaterThan(-1);

    // <link href> should link to MD5 named CSS bundle
    const domCssContent = await fs.readFile(
      path.join(outputDir, 'www.bundle/f85bc9fc5dd55297c7f68763d859ab65.css'),
      'utf8'
    );
    const md5DomCss = crypto.createHash('md5').update(domCssContent).digest('hex');
    expect(
      domEntry.indexOf(`<link rel="preload" href="./${md5DomCss}.css" as="style">`)
    ).toBeGreaterThan(-1);

    // Linked assets should be MD5 named
    //   - icon.png
    const iconAssetModule = `__d(function(g,r,i,a,m,e,d){m.exports={uri:"fb960eb5e4eb49ec8786c7f6c4a57ce2.png",`;
    expect(domJsBundleContent.indexOf(iconAssetModule)).toBeGreaterThan(-1);
    //   - font.ttf
    const ttfModule = `__d(function(g,r,i,a,m,e,d){m.exports="3858f62230ac3c915f300c664312c63f.ttf"},`;
    expect(domJsBundleContent.indexOf(ttfModule)).toBeGreaterThan(-1);

    // Because sourceMappingURL contains path info, we have to remove it and re-generate the MD5 hash files.
    const replacedFiles = await removeSourceMappingURLAsync(path.join(projectRoot, 'dist'));
    await updateMetadataForReplacedFilesAsync(outputDir, replacedFiles);

    const metadata = await JsonFile.readAsync(path.resolve(outputDir, 'metadata.json'));
    expect(metadata).toEqual({
      bundler: 'metro',
      fileMetadata: {
        ios: {
          assets: [
            {
              ext: 'css',
              path: expect.stringMatching(/^www\.bundle\/(?<md5>[0-9a-fA-F]{32})\.css$/),
            },
            {
              ext: 'html',
              path: expect.stringMatching(/^www\.bundle\/(?<md5>[0-9a-fA-F]{32})\.html$/),
            },

            {
              ext: 'js',
              path: expect.stringMatching(/^www\.bundle\/(?<md5>[0-9a-fA-F]{32})\.js$/),
            },

            {
              ext: 'png',
              path: expect.pathMatching('assets/369745d4a4a6fa62fa0ed495f89aa964'),
            },
            {
              ext: 'png',
              path: expect.pathMatching('assets/4f355ba1efca4b9c0e7a6271af047f61'),
            },
            {
              ext: 'png',
              path: expect.pathMatching('assets/5b50965d3dfbc518fe50ce36c314a6ec'),
            },
            {
              ext: 'png',
              path: expect.pathMatching('assets/817aca47ff3cea63020753d336e628a4'),
            },
            {
              ext: 'png',
              path: expect.pathMatching('assets/e62addcde857ebdb7342e6b9f1095e97'),
            },
            {
              ext: 'png',
              path: expect.pathMatching('assets/fb960eb5e4eb49ec8786c7f6c4a57ce2'),
            },
            {
              ext: 'ttf',
              path: expect.pathMatching('assets/3858f62230ac3c915f300c664312c63f'),
            },
          ],
          bundle: expect.pathMatching(/_expo\/static\/js\/ios\/AppEntry-.*\.hbc$/),
        },
      },
      version: 0,
    });

    const assetmap = await JsonFile.readAsync(path.resolve(outputDir, 'assetmap.json'));
    expect(assetmap).toEqual({
      '369745d4a4a6fa62fa0ed495f89aa964': {
        __packager_asset: true,
        fileHashes: ['369745d4a4a6fa62fa0ed495f89aa964'],
        fileSystemLocation: expect.pathMatching(/\/.*\/@expo\/metro-runtime\/assets$/),
        files: [expect.pathMatching(/\/.*\/@expo\/metro-runtime\/assets\/close\.png$/)],
        hash: '369745d4a4a6fa62fa0ed495f89aa964',
        height: 28,
        httpServerLocation: './assets/node_modules/@expo/metro-runtime/assets',
        name: 'close.369745d4a4a6fa62fa0ed495f89aa964',
        scales: [1],
        type: 'png',
        width: 28,
      },
      '3858f62230ac3c915f300c664312c63f': {
        __packager_asset: true,
        fileHashes: ['3858f62230ac3c915f300c664312c63f'],
        fileSystemLocation: expect.pathMatching(/\/.*\/dom-export\/assets$/),
        files: [expect.pathMatching(/\/.*\/dom-export\/assets\/font\.ttf$/)],
        hash: '3858f62230ac3c915f300c664312c63f',
        httpServerLocation: './assets/assets',
        name: 'font.3858f62230ac3c915f300c664312c63f',
        scales: [1],
        type: 'ttf',
      },
      '4f355ba1efca4b9c0e7a6271af047f61': {
        __packager_asset: true,
        fileHashes: ['4f355ba1efca4b9c0e7a6271af047f61'],
        fileSystemLocation: expect.pathMatching(/\/.*\/@expo\/metro-runtime\/assets$/),
        files: [expect.pathMatching(/\/.*\/@expo\/metro-runtime\/assets\/alert-triangle\.png$/)],
        hash: '4f355ba1efca4b9c0e7a6271af047f61',
        height: 42,
        httpServerLocation: './assets/node_modules/@expo/metro-runtime/assets',
        name: 'alert-triangle.4f355ba1efca4b9c0e7a6271af047f61',
        scales: [1],
        type: 'png',
        width: 48,
      },
      '5b50965d3dfbc518fe50ce36c314a6ec': {
        __packager_asset: true,
        fileHashes: ['5b50965d3dfbc518fe50ce36c314a6ec'],
        fileSystemLocation: expect.pathMatching(/\/.*\/@expo\/metro-runtime\/assets$/),
        files: [expect.pathMatching(/\/.*\/@expo\/metro-runtime\/assets\/chevron-left\.png$/)],
        hash: '5b50965d3dfbc518fe50ce36c314a6ec',
        height: 28,
        httpServerLocation: './assets/node_modules/@expo/metro-runtime/assets',
        name: 'chevron-left.5b50965d3dfbc518fe50ce36c314a6ec',
        scales: [1],
        type: 'png',
        width: 16,
      },
      '817aca47ff3cea63020753d336e628a4': {
        __packager_asset: true,
        fileHashes: ['817aca47ff3cea63020753d336e628a4'],
        fileSystemLocation: expect.pathMatching(/\/.*\/@expo\/metro-runtime\/assets$/),
        files: [expect.pathMatching(/\/.*\/@expo\/metro-runtime\/assets\/loader\.png$/)],
        hash: '817aca47ff3cea63020753d336e628a4',
        height: 44,
        httpServerLocation: './assets/node_modules/@expo/metro-runtime/assets',
        name: 'loader.817aca47ff3cea63020753d336e628a4',
        scales: [1],
        type: 'png',
        width: 44,
      },
      e62addcde857ebdb7342e6b9f1095e97: {
        __packager_asset: true,
        fileHashes: ['e62addcde857ebdb7342e6b9f1095e97'],
        fileSystemLocation: expect.pathMatching(/\/.*\/@expo\/metro-runtime\/assets$/),
        files: [expect.pathMatching(/\/.*\/@expo\/metro-runtime\/assets\/chevron-right\.png$/)],
        hash: 'e62addcde857ebdb7342e6b9f1095e97',
        height: 28,
        httpServerLocation: './assets/node_modules/@expo/metro-runtime/assets',
        name: 'chevron-right.e62addcde857ebdb7342e6b9f1095e97',
        scales: [1],
        type: 'png',
        width: 16,
      },
      fb960eb5e4eb49ec8786c7f6c4a57ce2: {
        __packager_asset: true,
        fileHashes: ['fb960eb5e4eb49ec8786c7f6c4a57ce2'],
        fileSystemLocation: expect.pathMatching(/\/.*\/assets$/),
        files: [expect.pathMatching(/\/.*\/assets\/icon\.png$/)],
        hash: 'fb960eb5e4eb49ec8786c7f6c4a57ce2',
        height: 1,
        httpServerLocation: './assets/assets',
        name: 'icon.fb960eb5e4eb49ec8786c7f6c4a57ce2',
        scales: [1],
        type: 'png',
        width: 1,
      },
    });

    // If this changes then everything else probably changed as well.
    const outputFiles = findProjectFiles(outputDir);
    // Remove maps because there are path info inside maps and they are not deterministic across machines.
    const outputFilesWithoutMap = outputFiles
      .filter((file) => !(file.startsWith('www.bundle/') && file.endsWith('.map')))
      .sort();
    expect(outputFilesWithoutMap).toEqual([
      expect.stringMatching(/_expo\/static\/js\/ios\/AppEntry-(?<md5>[0-9a-fA-F]{32})\.hbc$/),
      expect.stringMatching(/_expo\/static\/js\/ios\/AppEntry-(?<md5>[0-9a-fA-F]{32})\.hbc\.map$/),
      'assetmap.json',
      'assets/369745d4a4a6fa62fa0ed495f89aa964',
      'assets/3858f62230ac3c915f300c664312c63f',
      'assets/4f355ba1efca4b9c0e7a6271af047f61',
      'assets/5b50965d3dfbc518fe50ce36c314a6ec',
      'assets/817aca47ff3cea63020753d336e628a4',
      'assets/e62addcde857ebdb7342e6b9f1095e97',
      'assets/fb960eb5e4eb49ec8786c7f6c4a57ce2',

      'metadata.json',

      expect.stringMatching(/^www\.bundle\/(?<md5>[0-9a-fA-F]{32})\.js$/),
      expect.stringMatching(/^www\.bundle\/(?<md5>[0-9a-fA-F]{32})\.html$/),
      expect.stringMatching(/^www\.bundle\/(?<md5>[0-9a-fA-F]{32})\.css$/),
    ]);
  });
});

/**
 * Replace the DOM component HTML entry with MD5 by its contents
 */
async function replaceDomEntryWithMd5Async({
  distDir,
  domEntry,
  origJsFile,
  newJsFile,
}: {
  distDir: string;
  domEntry: string;
  origJsFile: string;
  newJsFile: string;
}): Promise<ReplacedFile> {
  let htmlContent = await fs.readFile(path.join(distDir, domEntry), 'utf8');
  htmlContent = htmlContent.replaceAll(origJsFile, newJsFile);
  await fs.writeFile(path.join(distDir, domEntry), htmlContent);
  const md5 = crypto.createHash('md5').update(htmlContent).digest('hex');
  const newFile = path.join(path.dirname(domEntry), `${md5}.html`);
  await fs.rename(path.join(distDir, domEntry), path.join(distDir, newFile));
  return {
    oldFile: toPosixPath(domEntry),
    newFile: toPosixPath(newFile),
  };
}

/**
 * Remove sourceMappingURL/debugId from JS files and recalculate their MD5 file names
 */
async function removeSourceMappingURLAsync(
  distDir: string
): Promise<{ oldFile: string; newFile: string }[]> {
  const replacedFiles: { oldFile: string; newFile: string }[] = [];

  const domEntries = globSync('www.bundle/**/*.html', {
    cwd: distDir,
  });
  const domJsFiles = globSync('www.bundle/**/*.js', {
    cwd: distDir,
  });
  for (const jsFile of domJsFiles) {
    let jsContent = await fs.readFile(path.join(distDir, jsFile), 'utf8');
    jsContent = jsContent
      .replace(/^\/\/# sourceMappingURL=.+\.map/m, '')
      .replace(/^\/\/# debugId=.*/m, '');

    await fs.writeFile(path.join(distDir, jsFile), jsContent);
    const md5 = crypto.createHash('md5').update(jsContent).digest('hex');
    const jsFileMd5 = `${md5}.js`;
    const newJsFile = path.join(path.dirname(jsFile), jsFileMd5);
    await fs.rename(path.join(distDir, jsFile), path.join(distDir, newJsFile));
    replacedFiles.push({
      oldFile: toPosixPath(jsFile),
      newFile: toPosixPath(newJsFile),
    });

    for (const domEntry of domEntries) {
      replacedFiles.push(
        await replaceDomEntryWithMd5Async({
          distDir,
          domEntry,
          origJsFile: path.basename(jsFile),
          newJsFile: jsFileMd5,
        })
      );
    }
  }

  return replacedFiles;
}

/**
 * Update metadata.json with the replaced files
 */
async function updateMetadataForReplacedFilesAsync(
  distDir: string,
  replacedFiles: ReplacedFile[]
): Promise<void> {
  const metadata = JSON.parse(await fs.readFile(path.join(distDir, 'metadata.json'), 'utf8'));
  let assets = metadata.fileMetadata.ios.assets;
  const removedFiles = replacedFiles.map((replacedFile) => replacedFile.oldFile);
  const addedFiles = replacedFiles.map((replacedFile) => replacedFile.newFile);
  assets = assets.filter((asset: any) => !removedFiles.includes(toPosixPath(asset.path)));
  for (const addedFile of addedFiles) {
    assets.push({
      path: addedFile,
      ext: path.extname(addedFile).slice(1),
    });
  }
  // Use POSIX path for consistency for testing
  assets = assets.map((asset: any) => ({
    ext: asset.ext,
    path: toPosixPath(asset.path),
  }));
  metadata.fileMetadata.ios.assets = assets.sort((a: any, b: any) => {
    if (a.ext !== b.ext) {
      return a.ext.localeCompare(b.ext);
    }
    return a.path.localeCompare(b.path);
  });
  await fs.writeFile(path.join(distDir, 'metadata.json'), JSON.stringify(metadata));
}
