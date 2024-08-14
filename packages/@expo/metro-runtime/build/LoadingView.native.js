"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let LoadingView;
try {
    LoadingView = require('react-native/Libraries/Utilities/LoadingView');
}
catch {
    // In react-native 0.75.0 LoadingView was renamed to DevLoadingView
    try {
        LoadingView = require('react-native/Libraries/Utilities/DevLoadingView');
    }
    catch { }
}
exports.default = LoadingView;
//# sourceMappingURL=LoadingView.native.js.map