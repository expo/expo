"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.minFadeDurationMs = exports.maxFadeDurationMs = exports.defaultFadeDurationMs = exports.computeFadeDurationMs = void 0;
const defaultFadeDurationMs = 0;
exports.defaultFadeDurationMs = defaultFadeDurationMs;
const minFadeDurationMs = 0;
exports.minFadeDurationMs = minFadeDurationMs;
const maxFadeDurationMs = 5000;
exports.maxFadeDurationMs = maxFadeDurationMs;
const computeFadeDurationMs = maybeDuration => {
  if (typeof maybeDuration !== 'number') {
    return defaultFadeDurationMs;
  }
  const duration = maybeDuration;
  if (duration >= maxFadeDurationMs) {
    return maxFadeDurationMs;
  }
  if (duration <= minFadeDurationMs) {
    return minFadeDurationMs;
  }
  return duration;
};
exports.computeFadeDurationMs = computeFadeDurationMs;
//# sourceMappingURL=fadeDurationUtils.js.map