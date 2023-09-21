'use strict';

var _require = require('../Utilities/PolyfillFunctions'),
  polyfillGlobal = _require.polyfillGlobal;
polyfillGlobal('XMLHttpRequest', function () {
  return require('../Network/XMLHttpRequest');
});
polyfillGlobal('FormData', function () {
  return require('../Network/FormData');
});
polyfillGlobal('fetch', function () {
  return require('../Network/fetch').fetch;
});
polyfillGlobal('Headers', function () {
  return require('../Network/fetch').Headers;
});
polyfillGlobal('Request', function () {
  return require('../Network/fetch').Request;
});
polyfillGlobal('Response', function () {
  return require('../Network/fetch').Response;
});
polyfillGlobal('WebSocket', function () {
  return require('../WebSocket/WebSocket');
});
polyfillGlobal('Blob', function () {
  return require('../Blob/Blob');
});
polyfillGlobal('File', function () {
  return require('../Blob/File');
});
polyfillGlobal('FileReader', function () {
  return require('../Blob/FileReader');
});
polyfillGlobal('URL', function () {
  return require('../Blob/URL').URL;
});
polyfillGlobal('URLSearchParams', function () {
  return require('../Blob/URL').URLSearchParams;
});
polyfillGlobal('AbortController', function () {
  return require('abort-controller/dist/abort-controller').AbortController;
});
polyfillGlobal('AbortSignal', function () {
  return require('abort-controller/dist/abort-controller').AbortSignal;
});