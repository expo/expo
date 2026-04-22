// isEligibleForPrediction
// https://developer.apple.com/documentation/foundation/nsuseractivity/2980674-iseligibleforprediction
let ExpoHead = null;
// If running in Expo Go.
if (typeof expo !== 'undefined' && !globalThis.expo?.modules?.ExpoGo) {
    ExpoHead = globalThis.expo?.modules?.ExpoHead;
}
export { ExpoHead };
//# sourceMappingURL=ExpoHeadModule.js.map