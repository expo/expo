"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeMetadataToTags = serializeMetadataToTags;
exports.serializeMetadataToHtml = serializeMetadataToHtml;
exports.serializeMetadataToReact = serializeMetadataToReact;
const jsx_runtime_1 = require("react/jsx-runtime");
const render_1 = require("./render");
const resolve_1 = require("./resolve");
const types_1 = require("./types");
function serializeMetadataToTags(metadata) {
    return (0, render_1.renderMetadataTags)((0, resolve_1.resolveMetadata)(metadata));
}
function serializeMetadataToHtml(metadata) {
    return (0, render_1.renderMetadataHtml)((0, render_1.renderMetadataTags)((0, resolve_1.resolveMetadata)(metadata)));
}
function serializeMetadataToReact(metadata) {
    return serializeMetadataToTags(metadata).map((tag, index) => {
        if ((0, types_1.isTitleTag)(tag)) {
            return (0, jsx_runtime_1.jsx)("title", { children: tag.content }, "metadata-title");
        }
        return (0, jsx_runtime_1.jsx)(tag.tagName, { ...tag.attributes }, `metadata-${tag.tagName}-${index}`);
    });
}
//# sourceMappingURL=serialize.js.map