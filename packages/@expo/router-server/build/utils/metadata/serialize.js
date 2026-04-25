"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeMetadataToTags = serializeMetadataToTags;
exports.serializeMetadataToHtml = serializeMetadataToHtml;
exports.serializeMetadataToReactElements = serializeMetadataToReactElements;
const react_1 = require("react");
const render_1 = require("./render");
const resolve_1 = require("./resolve");
function serializeMetadataToTags(metadata) {
    return (0, render_1.renderMetadataTags)((0, resolve_1.resolveMetadata)(metadata));
}
function serializeMetadataToHtml(metadata) {
    return (0, render_1.renderMetadataHtml)((0, render_1.renderMetadataTags)((0, resolve_1.resolveMetadata)(metadata)));
}
function serializeMetadataToReactElements(metadata) {
    return serializeMetadataToTags(metadata).map((tag, index) => {
        if (tag.tagName === 'title') {
            return (0, react_1.createElement)('title', { key: `metadata-title-${index}` }, tag.content ?? '');
        }
        return (0, react_1.createElement)(tag.tagName, {
            key: `metadata-${tag.tagName}-${index}`,
            ...(tag.attributes ?? {}),
        });
    });
}
//# sourceMappingURL=serialize.js.map