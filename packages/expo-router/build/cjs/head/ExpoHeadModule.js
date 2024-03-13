"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ExpoHead = void 0;
// isEligibleForPrediction
// https://developer.apple.com/documentation/foundation/nsuseractivity/2980674-iseligibleforprediction

let ExpoHead = exports.ExpoHead = null;

// If running in Expo Go.
if (typeof expo !== 'undefined' && globalThis.expo?.modules?.ExpoGo) {
  exports.ExpoHead = ExpoHead = globalThis.expo?.modules?.ExpoHead;
}
//# sourceMappingURL=ExpoHeadModule.js.map