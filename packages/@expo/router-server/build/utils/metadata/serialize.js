"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeMetadataToTags = serializeMetadataToTags;
exports.serializeMetadataToHtml = serializeMetadataToHtml;
const render_1 = require("./render");
const resolve_1 = require("./resolve");
function serializeMetadataToTags(metadata) {
    return (0, render_1.renderMetadataTags)((0, resolve_1.resolveMetadata)(metadata));
}
function serializeMetadataToHtml(metadata) {
    return (0, render_1.renderMetadataHtml)((0, render_1.renderMetadataTags)((0, resolve_1.resolveMetadata)(metadata)));
}
//# sourceMappingURL=serialize.js.map