// Replacement for `react-native/Libraries/Core/setUpXHR.js`

import { polyfillGlobal } from 'react-native/Libraries/Utilities/PolyfillFunctions';

// Fetch with streaming support.
polyfillGlobal('fetch', () => require('react-native-fetch-api').fetch);
polyfillGlobal('Headers', () => require('react-native-fetch-api').Headers);
polyfillGlobal('Request', () => require('react-native-fetch-api').Request);
polyfillGlobal('Response', () => require('react-native-fetch-api').Response);

/**
 * Set up XMLHttpRequest. The native XMLHttpRequest in Chrome dev tools is CORS
 * aware and won't let you fetch anything from the internet.
 *
 * You can use this module directly, or just require InitializeCore.
 */
polyfillGlobal('XMLHttpRequest', () => require('react-native/Libraries/Network/XMLHttpRequest'));
polyfillGlobal('FormData', () => require('react-native/Libraries/Network/FormData'));

polyfillGlobal('WebSocket', () => require('react-native/Libraries/WebSocket/WebSocket'));
polyfillGlobal('Blob', () => require('react-native/Libraries/Blob/Blob'));
polyfillGlobal('File', () => require('react-native/Libraries/Blob/File'));
polyfillGlobal('FileReader', () => require('react-native/Libraries/Blob/FileReader'));

import './src/standalone';
