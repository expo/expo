"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertFontWeightToStringFontWeight = convertFontWeightToStringFontWeight;
function convertFontWeightToStringFontWeight(fontWeight) {
    if (typeof fontWeight === 'number') {
        return String(fontWeight);
    }
    return fontWeight;
}
//# sourceMappingURL=style.js.map