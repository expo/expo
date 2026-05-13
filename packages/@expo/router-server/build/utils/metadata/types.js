"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTitleTag = isTitleTag;
exports.isMetaTag = isMetaTag;
exports.isLinkTag = isLinkTag;
function isTitleTag(tag) {
    return tag.tagName === 'title';
}
function isMetaTag(tag) {
    return tag.tagName === 'meta';
}
function isLinkTag(tag) {
    return tag.tagName === 'link';
}
//# sourceMappingURL=types.js.map