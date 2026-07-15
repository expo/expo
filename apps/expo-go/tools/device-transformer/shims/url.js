'use strict';
const URLImpl = typeof globalThis.URL === 'function'
  ? globalThis.URL
  : class URL {
      constructor(href) {
        this.href = String(href);
        const m = this.href.match(/^([a-z]+:)\/\/([^/]*)(.*)$/i);
        this.protocol = m ? m[1] : '';
        this.host = m ? m[2] : '';
        this.pathname = m ? m[3] : this.href;
        this.search = '';
        this.hash = '';
      }
      toString() { return this.href; }
    };
function pathToFileURL(p) {
  return new URLImpl('file://' + String(p).split('/').map(encodeURIComponent).join('/'));
}
function fileURLToPath(u) {
  const href = typeof u === 'string' ? u : u.href;
  if (!href.startsWith('file://')) throw new Error('fileURLToPath: not a file URL: ' + href);
  return decodeURIComponent(href.slice(7));
}
module.exports = { URL: URLImpl, URLSearchParams: globalThis.URLSearchParams, pathToFileURL, fileURLToPath, parse: (s) => new URLImpl(s), format: (u) => String(u) };
