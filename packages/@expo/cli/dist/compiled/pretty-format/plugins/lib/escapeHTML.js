'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = escapeHTML;
function escapeHTML(str) {
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}