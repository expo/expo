// This file can be bundled to a single file with minimal overlap to the main bundle.

import { polyfillGlobal } from 'react-native/Libraries/Utilities/PolyfillFunctions';

// Same as server polyfill
polyfillGlobal('ReadableStream', () => require('web-streams-polyfill/ponyfill/es6').ReadableStream);
polyfillGlobal('WritableStream', () => require('web-streams-polyfill/ponyfill/es6').WritableStream);

//
polyfillGlobal('TextEncoder', () => require('text-encoding').TextEncoder);
polyfillGlobal('TextDecoder', () => require('text-encoding').TextDecoder);

//
polyfillGlobal(
  'AbortController',
  () => require('abort-controller/dist/abort-controller.js').AbortController
);
polyfillGlobal(
  'AbortSignal',
  () => require('abort-controller/dist/abort-controller.js').AbortSignal
);

//
polyfillGlobal('atob', () => require('base-64').decode);
polyfillGlobal('btoa', () => require('base-64').encode);

// From `react-native-url-polyfill` but without dependence on `react-native`.
// https://www.npmjs.com/package/react-native-url-polyfill
polyfillGlobal('URLSearchParams', () => require('whatwg-url-without-unicode').URLSearchParams);
polyfillGlobal('URL', () => {
  const { URL: whatwgUrl } = require('whatwg-url-without-unicode');

  let BLOB_URL_PREFIX = null;
  // if iOS: let BLOB_URL_PREFIX = 'blob:'

  // Pull the blob module without importing React Native.
  const BlobModule =
    global.RN$Bridgeless !== true
      ? // Legacy RN implementation
        global.nativeModuleProxy['BlobModule']
      : // Newer RN implementation
        global.__turboModuleProxy('BlobModule');

  const constants = 'BLOB_URI_SCHEME' in BlobModule ? BlobModule : BlobModule.getConstants();

  if (constants && typeof constants.BLOB_URI_SCHEME === 'string') {
    BLOB_URL_PREFIX = constants.BLOB_URI_SCHEME + ':';
    if (typeof constants.BLOB_URI_HOST === 'string') {
      BLOB_URL_PREFIX += `//${constants.BLOB_URI_HOST}/`;
    }
  }

  /**
   * To allow Blobs be accessed via `content://` URIs,
   * you need to register `BlobProvider` as a ContentProvider in your app's `AndroidManifest.xml`:
   *
   * ```xml
   * <manifest>
   *   <application>
   *     <provider
   *       android:name="com.facebook.react.modules.blob.BlobProvider"
   *       android:authorities="@string/blob_provider_authority"
   *       android:exported="false"
   *     />
   *   </application>
   * </manifest>
   * ```
   * And then define the `blob_provider_authority` string in `res/values/strings.xml`.
   * Use a dotted name that's entirely unique to your app:
   *
   * ```xml
   * <resources>
   *   <string name="blob_provider_authority">your.app.package.blobs</string>
   * </resources>
   * ```
   */

  whatwgUrl.createObjectURL = function createObjectURL(blob) {
    if (BLOB_URL_PREFIX === null) {
      throw new Error('Cannot create URL for blob!');
    }
    return `${BLOB_URL_PREFIX}${blob.data.blobId}?offset=${blob.data.offset}&size=${blob.size}`;
  };

  whatwgUrl.revokeObjectURL = function revokeObjectURL(url) {
    // Do nothing.
  };

  return whatwgUrl;
});
