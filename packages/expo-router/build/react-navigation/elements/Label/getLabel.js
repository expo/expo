"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLabel = getLabel;
function getLabel(options, fallback) {
    return options.label !== undefined
        ? options.label
        : options.title !== undefined
            ? options.title
            : fallback;
}
//# sourceMappingURL=getLabel.js.map