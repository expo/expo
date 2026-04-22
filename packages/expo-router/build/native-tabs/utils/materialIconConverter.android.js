"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertMaterialIconNameToImageSource = convertMaterialIconNameToImageSource;
const jsx_runtime_1 = require("react/jsx-runtime");
const expo_symbols_1 = require("expo-symbols");
const icon_1 = require("./icon");
const elements_1 = require("../common/elements");
function convertMaterialIconNameToImageSource(name) {
    return (0, icon_1.convertComponentSrcToImageSource)((0, jsx_runtime_1.jsx)(elements_1.NativeTabsTriggerPromiseIcon, { loader: () => (0, expo_symbols_1.unstable_getMaterialSymbolSourceAsync)(name, 24, 'white') }));
}
//# sourceMappingURL=materialIconConverter.android.js.map