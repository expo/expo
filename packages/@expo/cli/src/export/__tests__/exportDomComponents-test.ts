import crypto from 'crypto';

import { updateDomComponentAssetsForMD5Naming } from '../exportDomComponents';
import { type BundleOutput, type ExportAssetMap } from '../saveAssets';

jest.mock('crypto');
describe(updateDomComponentAssetsForMD5Naming, () => {
  const mockFilenameMd5 = jest.fn().mockReturnValue('MOCK_FILENAME_MD5_HASH');
  const mockMd5 = jest.fn().mockReturnValue('MOCK_CONTENTS_MD5_HASH');

  (crypto.createHash as jest.Mock).mockImplementation((algorithm: string) => {
    if (algorithm === 'md5') {
      const self = {
        isFilename: false,
        update: jest.fn().mockImplementation((source) => {
          self.isFilename = source.startsWith('file://');
          return self;
        }),
        digest: jest.fn().mockImplementation(() => {
          return self.isFilename ? mockFilenameMd5() : mockMd5();
        }),
      };
      return self;
    }
    return jest.fn();
  });

  it('should update asset paths and remove leading slashes from filenames', () => {
    const domComponentReference = 'file:///app/components/DomView.tsx';
    const nativeBundle1Chunk = `
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  var _interopRequireDefault = require(_dependencyMap[0]);
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = undefined;
  var _react = _interopRequireDefault(require(_dependencyMap[1]));
  var _internal = require(_dependencyMap[2]);
  var filePath = "${mockFilenameMd5()}.html";
  var _default = exports.default = _react.default.forwardRef((props, ref) => {
    return _react.default.createElement(_internal.WebView, {
      ref,
      ...props,
      filePath,
    });
  });
},896,[4,157,897]);
`;

    const nativeBundle: BundleOutput = {
      artifacts: [
        {
          filename: '_expo/static/js/ios/entry-native1.js',
          originFilename: 'node_modules/expo-router/entry.js',
          type: 'js',
          metadata: {},
          source: nativeBundle1Chunk,
        },
      ],
      assets: [
        {
          __packager_asset: true,
          fileSystemLocation: '/app/node_modules/@react-navigation/elements/lib/commonjs/assets',
          httpServerLocation:
            './assets/node_modules/@react-navigation/elements/lib/commonjs/assets',
          width: 96,
          height: 96,
          scales: [1, 2, 3],
          files: [
            '/app/node_modules/@react-navigation/elements/lib/commonjs/assets/close-icon.png',
            '/app/node_modules/@react-navigation/elements/lib/commonjs/assets/close-icon@2x.png',
            '/app/node_modules/@react-navigation/elements/lib/commonjs/assets/close-icon@3x.png',
          ],
          hash: '3162e8a244d8f6fbd259e79043e23ce4',
          name: 'close-icon',
          type: 'png',
          fileHashes: [
            'd84e297c3b3e49a614248143d53e40ca',
            '1190ab078c57159f4245a328118fcd9a',
            '0747a1317bbe9c6fc340b889ef8ab3ae',
          ],
        },
      ],
    };

    const domComponentBundle: BundleOutput = {
      artifacts: [],
      assets: [],
    };
    const files: ExportAssetMap = new Map([
      [
        '_expo/static/js/ios/entry-native1.js',
        {
          contents: nativeBundle1Chunk,
        },
      ],
    ]);
    const htmlOutputName = 'www.bundle/dom1.html';

    const assetsMetadata = updateDomComponentAssetsForMD5Naming({
      domComponentReference,
      nativeBundle,
      domComponentBundle,
      files,
      htmlOutputName,
    });

    // Expects to add js and html to assets metadata
    expect(assetsMetadata).toEqual([
      // {
      //   ext: 'js',
      //   path: 'www.bundle/_expo/static/js/web/entry-dom1.js',
      // },
      // {
      //   ext: 'html',
      //   path: 'www.bundle/dom1.html',
      // },
    ]);

    const nativeJsContents = files.get('_expo/static/js/ios/entry-native1.js').contents;
    expect(nativeJsContents).not.toEqual(nativeBundle1Chunk);
    expect(nativeJsContents).toContain('MOCK_CONTENTS_MD5_HASH');
  });
});
