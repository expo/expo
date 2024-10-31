import crypto from 'crypto';

import { updateDomComponentAssetsForMD5Naming } from '../exportDomComponents';
import { type BundleOutput, type ExportAssetMap } from '../saveAssets';

jest.mock('crypto');
describe(updateDomComponentAssetsForMD5Naming, () => {
  const mockMd5 = jest.fn().mockReturnValue('MOCK_MD5_HASH');
  const mockSha1 = jest.fn().mockReturnValue('MOCK_SHA1_HASH');

  (crypto.createHash as jest.Mock).mockImplementation((algorithm: string) => {
    if (algorithm === 'md5') {
      return {
        update: jest.fn().mockReturnThis(),
        digest: mockMd5,
      };
    } else if (algorithm === 'sha1') {
      return {
        update: jest.fn().mockReturnThis(),
        digest: mockSha1,
      };
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
  var source = {
    uri: process.env.EXPO_DOM_BASE_URL + "/${mockSha1()}.html"
  };
  var _default = exports.default = _react.default.forwardRef((props, ref) => {
    return _react.default.createElement(_internal.WebView, {
      ref,
      ...props,
      source
    });
  });
},896,[4,157,897]);
`;

    const domHtml1 = `
<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">

        <style id="expo-dom-component-style">
        /* These styles make the body full-height */
        html,
        body {
          -webkit-overflow-scrolling: touch; /* Enables smooth momentum scrolling */
        }
        /* These styles make the root element full-height */
        #root {
          display: flex;
          flex: 1;
        }
        </style>
    </head>
    <body>
    <noscript>DOM Components require <code>javaScriptEnabled</code></noscript>
        <!-- Root element for the DOM component. -->
        <div id="root"></div>

    <script src="./_expo/static/js/web/entry-dom1.js" defer></script>
</body>
</html>
`;
    const domBundle1Chunk = `
__d((function(g,r,i,a,m,e,d){m.exports={uri:"assets/assets/images/react-logo.d883906de993aa65bf0ef0d1bc2ff6ad.png",width:100,height:100}}),1168,[]);
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
      artifacts: [
        {
          filename: '_expo/static/js/web/entry-dom1.js',
          originFilename: 'node_modules/expo/dom/entry.js',
          type: 'js',
          metadata: {},
          source: domBundle1Chunk,
        },
      ],
      assets: [
        {
          __packager_asset: true,
          fileSystemLocation: '/Users/kudo/sdk52domota/assets/images',
          httpServerLocation: './assets/assets/images',
          width: 100,
          height: 100,
          scales: [1, 2, 3],
          files: [
            '/Users/kudo/sdk52domota/assets/images/react-logo.png',
            '/Users/kudo/sdk52domota/assets/images/react-logo@2x.png',
            '/Users/kudo/sdk52domota/assets/images/react-logo@3x.png',
          ],
          hash: '633435dcb418833920a16771610ca404',
          name: 'react-logo.d883906de993aa65bf0ef0d1bc2ff6ad',
          type: 'png',
          fileHashes: [
            '695d5a1c6f29a689130f3aaa573aec6e',
            'b507e7f2c91ebc8fe24dee79ccb3b600',
            '8a4d0e5b845044e56e3b2df627d01cfd',
          ],
        },
      ],
    };
    const files: ExportAssetMap = new Map([
      [
        '_expo/static/js/ios/entry-native1.js',
        {
          contents: nativeBundle1Chunk,
        },
      ],
      [
        '/www.bundle/_expo/static/js/web/entry-dom1.js',
        {
          contents: domBundle1Chunk,
        },
      ],
      [
        'www.bundle/dom1.html',
        {
          contents: domHtml1,
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
      {
        ext: 'js',
        path: 'www.bundle/_expo/static/js/web/entry-dom1.js',
      },
      {
        ext: 'html',
        path: 'www.bundle/dom1.html',
      },
    ]);

    const domJsContents = files.get('/www.bundle/_expo/static/js/web/entry-dom1.js').contents;
    expect(domJsContents).not.toEqual(domBundle1Chunk);
    expect(domJsContents).toContain(domComponentBundle.assets[0].fileHashes[0]);

    const domHtmlContents = files.get('www.bundle/dom1.html').contents;
    expect(domHtmlContents).not.toEqual(domHtml1);
    expect(domHtmlContents).toContain('MOCK_MD5_HASH');

    const nativeJsContents = files.get('_expo/static/js/ios/entry-native1.js').contents;
    expect(nativeJsContents).not.toEqual(nativeBundle1Chunk);
    expect(nativeJsContents).toContain('MOCK_MD5_HASH');
  });
});
