'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var deepFreezeAndThrowOnMutationInDev = require('./Utilities/deepFreezeAndThrowOnMutationInDev');
var UTFSequence = deepFreezeAndThrowOnMutationInDev({
  BOM: "\uFEFF",
  BULLET: "\u2022",
  BULLET_SP: "\xA0\u2022\xA0",
  MIDDOT: "\xB7",
  MIDDOT_SP: "\xA0\xB7\xA0",
  MIDDOT_KATAKANA: "\u30FB",
  MDASH: "\u2014",
  MDASH_SP: "\xA0\u2014\xA0",
  NDASH: "\u2013",
  NDASH_SP: "\xA0\u2013\xA0",
  NEWLINE: "\n",
  NBSP: "\xA0",
  PIZZA: "\uD83C\uDF55",
  TRIANGLE_LEFT: "\u25C0",
  TRIANGLE_RIGHT: "\u25B6"
});
var _default = UTFSequence;
exports.default = _default;