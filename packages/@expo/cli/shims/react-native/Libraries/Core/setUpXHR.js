/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const { polyfillGlobal } = require('react-native/Libraries/Utilities/PolyfillFunctions');

/**
 * Set up XMLHttpRequest. The native XMLHttpRequest in Chrome dev tools is CORS
 * aware and won't let you fetch anything from the internet.
 *
 * You can use this module directly, or just require InitializeCore.
 */
polyfillGlobal('XMLHttpRequest', () => require('react-native/Libraries/Network/XMLHttpRequest'));
polyfillGlobal('FormData', () => require('react-native/Libraries/Network/FormData'));

// polyfillGlobal('fetch', () => require('../Network/fetch').fetch);
// polyfillGlobal('Headers', () => require('../Network/fetch').Headers);
// polyfillGlobal('Request', () => require('../Network/fetch').Request);
// polyfillGlobal('Response', () => require('../Network/fetch').Response);
polyfillGlobal('WebSocket', () => require('react-native/Libraries/WebSocket/WebSocket'));
polyfillGlobal('Blob', () => require('react-native/Libraries/Blob/Blob'));
polyfillGlobal('File', () => require('react-native/Libraries/Blob/File'));
polyfillGlobal('FileReader', () => require('react-native/Libraries/Blob/FileReader'));
// polyfillGlobal('URL', () => require('../Blob/URL').URL); // flowlint-line untyped-import:off
// polyfillGlobal('URLSearchParams', () => require('../Blob/URL').URLSearchParams); // flowlint-line untyped-import:off
// polyfillGlobal(
//   'AbortController',
//   () => require('abort-controller/dist/abort-controller').AbortController, // flowlint-line untyped-import:off
// );
// polyfillGlobal(
//   'AbortSignal',
//   () => require('abort-controller/dist/abort-controller').AbortSignal, // flowlint-line untyped-import:off
// );
