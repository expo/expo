/**
 * Copyright © 2023-present 650 Industries, Inc. (aka Expo)
 * Copyright © Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file should not import `react-native` in order to remain self-contained.

import { URL, URLSearchParams } from 'whatwg-url-without-unicode';

let isSetup = false;
let BLOB_URL_PREFIX: string | null = null;

function getBlobUrlPrefix() {
  if (isSetup) return BLOB_URL_PREFIX;
  isSetup = true;
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
    BLOB_URL_PREFIX = encodeURIComponent(constants.BLOB_URI_SCHEME) + ':';
    if (typeof constants.BLOB_URI_HOST === 'string') {
      BLOB_URL_PREFIX += `//${encodeURIComponent(constants.BLOB_URI_HOST)}/`;
    }
  }
  return BLOB_URL_PREFIX;
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
URL.createObjectURL = function createObjectURL(blob) {
  if (getBlobUrlPrefix() == null) {
    throw new Error('Cannot create URL for blob');
  }
  return `${getBlobUrlPrefix()}${encodeURIComponent(blob.data.blobId)}?offset=${encodeURIComponent(
    blob.data.offset
  )}&size=${encodeURIComponent(blob.size)}`;
};

URL.revokeObjectURL = function revokeObjectURL(url) {
  // Do nothing.
};

export { URL, URLSearchParams };
