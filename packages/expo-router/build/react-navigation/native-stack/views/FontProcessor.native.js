"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processFonts = processFonts;
// @ts-expect-error importing private module
const ReactNativeStyleAttributes_1 = __importDefault(require("react-native/Libraries/Components/View/ReactNativeStyleAttributes"));
function processFonts(fontFamilies) {
    const fontFamilyProcessor = ReactNativeStyleAttributes_1.default.fontFamily?.process;
    if (typeof fontFamilyProcessor === 'function') {
        return fontFamilies.map(fontFamilyProcessor);
    }
    return fontFamilies;
}
//# sourceMappingURL=FontProcessor.native.js.map