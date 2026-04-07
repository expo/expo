"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHeaderTitle = getHeaderTitle;
function getHeaderTitle(options, fallback) {
    return typeof options.headerTitle === 'string'
        ? options.headerTitle
        : options.title !== undefined
            ? options.title
            : fallback;
}
//# sourceMappingURL=getHeaderTitle.js.map