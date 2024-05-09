"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SourceSkips = void 0;
var SourceSkips;
(function (SourceSkips) {
    // Skip nothing
    SourceSkips[SourceSkips["None"] = 1] = "None";
    // Skip version in app.json
    SourceSkips[SourceSkips["AppConfigVersion"] = 2] = "AppConfigVersion";
    // Skip runtimeVersion in app.json
    SourceSkips[SourceSkips["AppConfigRuntimeVersion"] = 4] = "AppConfigRuntimeVersion";
    // Skip app name in app.json
    SourceSkips[SourceSkips["AppConfigName"] = 8] = "AppConfigName";
    // Skip appId in app.json
    SourceSkips[SourceSkips["AppConfigAppId"] = 16] = "AppConfigAppId";
    // Skip schemes in app.json
    SourceSkips[SourceSkips["AppConfigSchemes"] = 32] = "AppConfigSchemes";
    // Skip EAS project information in app.json
    SourceSkips[SourceSkips["AppConfigEASProject"] = 64] = "AppConfigEASProject";
    // Skip assets in app.json
    SourceSkips[SourceSkips["AppConfigAssets"] = 128] = "AppConfigAssets";
})(SourceSkips || (exports.SourceSkips = SourceSkips = {}));
//#endregion
//# sourceMappingURL=Fingerprint.types.js.map