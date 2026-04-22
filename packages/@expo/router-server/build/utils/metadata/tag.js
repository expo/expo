"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderMetadataTag = renderMetadataTag;
exports.pushName = pushName;
exports.pushProperty = pushProperty;
exports.pushLink = pushLink;
function renderMetadataTag(tag) {
    const attributes = tag.attributes
        ? ' ' +
            Object.entries(tag.attributes)
                .filter(([, value]) => value != null && value !== '')
                .map(([key, value]) => `${key}="${escapeHtmlAttributeValue(value)}"`)
                .join(' ')
        : '';
    if (tag.tagName === 'title') {
        return `<title>${escapeHtmlTextNode(tag.content ?? '')}</title>`;
    }
    return `<${tag.tagName}${attributes}>`;
}
function pushName(tags, key, value) {
    pushMetaContent(tags, 'name', key, value);
}
function pushProperty(tags, key, value) {
    pushMetaContent(tags, 'property', key, value);
}
function pushLink(tags, attributes) {
    const normalizedAttributes = Object.fromEntries(Object.entries(attributes).filter(([, value]) => value != null && value !== ''));
    if (Object.keys(normalizedAttributes).length === 0) {
        return;
    }
    tags.push({
        tagName: 'link',
        attributes: normalizedAttributes,
    });
}
function escapeHtmlAttributeValue(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
function escapeHtmlTextNode(value) {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function pushMetaContent(tags, name, key, value) {
    if (!value)
        return;
    tags.push({
        tagName: 'meta',
        attributes: {
            [name]: key,
            content: value,
        },
    });
}
//# sourceMappingURL=tag.js.map