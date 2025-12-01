"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertMaterialIconNameToImageSource = convertMaterialIconNameToImageSource;
const expo_symbols_1 = require("expo-symbols");
const icon_1 = require("./icon");
const elements_1 = require("../common/elements");
function convertMaterialIconNameToImageSource(name) {
    return (0, icon_1.convertComponentSrcToImageSource)(<elements_1.NativeTabsTriggerPromiseIcon loader={() => (0, expo_symbols_1.unstable_getMaterialSymbolSourceAsync)(name, 24, 'white')}/>);
}
//# sourceMappingURL=materialIconConverter.android.js.map